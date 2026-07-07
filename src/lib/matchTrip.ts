import { destinations, type BudgetTier, type Destination, type Season, type Vibe } from "../data/destinations.js";

export interface TripQuery {
  budgetPerDay: number;
  vibes: Vibe[];
  homeAirport: string;
  tripLength: number;
  season: Season;
}

export interface TripMatch {
  destination: Destination;
  score: number;
  estimatedFlightHours: number;
  estimatedTotalCost: number;
}

function budgetTierFromAmount(amount: number): BudgetTier {
  if (amount < 80) return "shoestring";
  if (amount < 160) return "moderate";
  return "splurge";
}

function budgetDistance(userTier: BudgetTier, destTier: BudgetTier): number {
  const order: BudgetTier[] = ["shoestring", "moderate", "splurge"];
  return Math.abs(order.indexOf(userTier) - order.indexOf(destTier));
}

function estimateFlightHours(destination: Destination, homeAirport: string): number {
  const code = homeAirport.trim().toUpperCase();
  if (destination.airport === code) return 0;
  const known = destination.flightHoursFromHub[code];
  if (known) return known;
  // fall back to a rough average across known hubs, nudged by region
  const values = Object.values(destination.flightHoursFromHub) as number[];
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(avg * 10) / 10;
}

export function matchTrips(query: TripQuery, count = 3): TripMatch[] {
  const userTier = budgetTierFromAmount(query.budgetPerDay);

  const scored = destinations.map((destination) => {
    const vibeOverlap = destination.vibes.filter((v) => query.vibes.includes(v)).length;
    const vibeScore = query.vibes.length > 0 ? vibeOverlap / query.vibes.length : 0.3;

    const tierGap = budgetDistance(userTier, destination.budgetTier);
    const budgetScore = 1 - tierGap * 0.35;

    const seasonScore = destination.bestSeasons.includes(query.season) ? 1 : 0.4;

    const flightHours = estimateFlightHours(destination, query.homeAirport);
    // Longer trips can absorb longer flights; short trips favor closer destinations.
    const idealMaxFlight = query.tripLength <= 4 ? 8 : query.tripLength <= 8 ? 14 : 24;
    const flightScore = Math.max(0, 1 - Math.max(0, flightHours - idealMaxFlight) / 12);

    const score =
      vibeScore * 0.45 + budgetScore * 0.25 + seasonScore * 0.15 + flightScore * 0.15;

    const estimatedTotalCost = Math.round(destination.costPerDayUSD * query.tripLength);

    return {
      destination,
      score,
      estimatedFlightHours: flightHours,
      estimatedTotalCost,
    };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, count);
}
