import type Anthropic from "@anthropic-ai/sdk";
import { matchTrips } from "../../src/lib/matchTrip";
import type { Destination } from "../../src/data/destinations";
import type { AlternateTrip, FlightInfo, PlanTripRequest, PlanTripResponse, RecommendedTrip } from "../../src/types/trip";
import { CLAUDE_MODEL, createMessageWithRetry } from "./anthropic";
import { searchFlights as duffelSearchFlights, type FlightOffer, type SearchFlightsParams } from "./duffel";

const MAX_TURNS = 3;
const MAX_FLIGHT_SEARCHES = 4;
const SOFT_DEADLINE_MS = 25_000;
const CANDIDATE_COUNT = 4;

export interface AgentDeps {
  createMessage: (params: Anthropic.MessageCreateParamsNonStreaming) => Promise<Anthropic.Message>;
  searchFlights: (params: SearchFlightsParams) => Promise<FlightOffer[]>;
  now: () => number;
}

export const defaultAgentDeps: AgentDeps = {
  createMessage: createMessageWithRetry,
  searchFlights: duffelSearchFlights,
  now: () => Date.now(),
};

const searchFlightsTool: Anthropic.Tool = {
  name: "search_flights",
  description:
    "Look up real flight offers between two airports on a given date using the Duffel flight search API (sandbox/test data). Use this to check price and duration before recommending a destination.",
  input_schema: {
    type: "object",
    properties: {
      origin: { type: "string", description: "3-letter IATA airport code of the departure airport" },
      destination: { type: "string", description: "3-letter IATA airport code of the destination airport" },
      departure_date: { type: "string", description: "ISO date, YYYY-MM-DD" },
      return_date: { type: "string", description: "ISO date, YYYY-MM-DD (optional, round trip)" },
    },
    required: ["origin", "destination", "departure_date"],
  },
};

const flightInfoSchema = {
  type: "object",
  properties: {
    found: { type: "boolean" },
    totalAmount: { type: "number" },
    currency: { type: "string" },
    airline: { type: "string" },
    durationHours: { type: "number" },
    departAt: { type: "string" },
    arriveAt: { type: "string" },
  },
  required: ["found"],
} as const;

const finalizeRecommendationTool: Anthropic.Tool = {
  name: "finalize_recommendation",
  description:
    "Submit your final trip recommendation. Must be called exactly once, after you've checked flights for at least one candidate.",
  input_schema: {
    type: "object",
    properties: {
      destination_city: { type: "string", description: "The `city` field of the chosen candidate destination, verbatim." },
      rationale: { type: "string", description: "2-4 sentence personalized explanation of why this trip fits the traveler." },
      itinerary: {
        type: "array",
        items: { type: "string" },
        description: "4-6 short bullet-point itinerary highlights for the trip.",
      },
      flight: flightInfoSchema,
      alternates: {
        type: "array",
        description: "1-2 alternate candidates, each with a one-sentence reason they were not chosen.",
        items: {
          type: "object",
          properties: {
            destination_city: { type: "string" },
            reason: { type: "string" },
            flight: flightInfoSchema,
          },
          required: ["destination_city", "reason", "flight"],
        },
      },
    },
    required: ["destination_city", "rationale", "itinerary", "flight", "alternates"],
  },
};

function buildSystemPrompt(): string {
  return [
    "You are Wayfinder's trip-planning agent. You are given a traveler's preferences and a short list of candidate destinations.",
    "Use the search_flights tool to check real flight prices/durations for the 1-2 candidates you think best fit the traveler, before deciding.",
    "If a search returns no offers, try one more candidate from the list rather than giving up immediately.",
    "You have a limited number of flight searches available, so be selective.",
    "Once you have enough information, call finalize_recommendation exactly once with your final answer. Never answer in plain text.",
    "destination_city in your tool calls must exactly match one of the candidate `city` values you were given.",
  ].join(" ");
}

function buildUserPrompt(request: PlanTripRequest, candidates: Destination[]): string {
  const candidateSummaries = candidates.map((d) => ({
    city: d.city,
    country: d.country,
    airport: d.airport,
    vibes: d.vibes,
    budgetTier: d.budgetTier,
    tagline: d.tagline,
    highlights: d.highlights,
    costPerDayUSD: d.costPerDayUSD,
  }));

  return [
    "Traveler preferences:",
    JSON.stringify(
      {
        homeAirport: request.homeAirport,
        budgetPerDay: request.budgetPerDay,
        vibes: request.vibes,
        tripLength: request.tripLength,
        season: request.season,
        departureDate: request.departureDate,
      },
      null,
      2,
    ),
    "",
    "Candidate destinations (already pre-filtered for vibe/budget/season fit):",
    JSON.stringify(candidateSummaries, null, 2),
  ].join("\n");
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function parseFlightInfo(raw: unknown): FlightInfo {
  const input = (raw ?? {}) as Record<string, unknown>;
  return {
    found: Boolean(input.found),
    totalAmount: typeof input.totalAmount === "number" ? input.totalAmount : undefined,
    currency: typeof input.currency === "string" ? input.currency : undefined,
    airline: typeof input.airline === "string" ? input.airline : undefined,
    durationHours: typeof input.durationHours === "number" ? input.durationHours : undefined,
    departAt: typeof input.departAt === "string" ? input.departAt : undefined,
    arriveAt: typeof input.arriveAt === "string" ? input.arriveAt : undefined,
  };
}

function estimateTotalCost(destination: Destination, tripLength: number, flight: FlightInfo): number {
  const lodgingAndActivities = destination.costPerDayUSD * tripLength;
  return Math.round(lodgingAndActivities + (flight.found ? (flight.totalAmount ?? 0) : 0));
}

function findCandidateByCity(candidates: Destination[], city: unknown): Destination | undefined {
  if (typeof city !== "string") return undefined;
  return candidates.find((c) => c.city.toLowerCase() === city.toLowerCase());
}

function buildResponseFromFinalize(
  input: Record<string, unknown>,
  candidates: Destination[],
  request: PlanTripRequest,
  toolCallsUsed: number,
  usedFallback: boolean,
): PlanTripResponse {
  const chosenDestination = findCandidateByCity(candidates, input.destination_city) ?? candidates[0];
  const flight = parseFlightInfo(input.flight);

  const chosen: RecommendedTrip = {
    destination: chosenDestination,
    rationale: typeof input.rationale === "string" ? input.rationale : chosenDestination.tagline,
    itinerary: Array.isArray(input.itinerary) ? input.itinerary.filter((i): i is string => typeof i === "string") : chosenDestination.highlights,
    flight,
    estimatedTotalCost: estimateTotalCost(chosenDestination, request.tripLength, flight),
  };

  const rawAlternates = Array.isArray(input.alternates) ? input.alternates : [];
  const alternates: AlternateTrip[] = rawAlternates
    .map((raw): AlternateTrip | undefined => {
      if (typeof raw !== "object" || raw === null) return undefined;
      const altInput = raw as Record<string, unknown>;
      const destination = findCandidateByCity(candidates, altInput.destination_city);
      if (!destination) return undefined;
      const altFlight = parseFlightInfo(altInput.flight);
      return {
        destination,
        reason: typeof altInput.reason === "string" ? altInput.reason : "",
        flight: altFlight,
      };
    })
    .filter((a): a is AlternateTrip => a !== undefined)
    .slice(0, 2);

  return { chosen, alternates, meta: { toolCallsUsed, usedFallback } };
}

function fallbackResponse(candidates: Destination[], request: PlanTripRequest, toolCallsUsed: number): PlanTripResponse {
  const [top, ...rest] = candidates;
  const emptyFlight: FlightInfo = { found: false };
  return {
    chosen: {
      destination: top,
      rationale: top.description,
      itinerary: top.highlights,
      flight: emptyFlight,
      estimatedTotalCost: estimateTotalCost(top, request.tripLength, emptyFlight),
    },
    alternates: rest.slice(0, 2).map((destination) => ({
      destination,
      reason: destination.tagline,
      flight: emptyFlight,
    })),
    meta: { toolCallsUsed, usedFallback: true },
  };
}

export async function runTripAgent(request: PlanTripRequest, deps: AgentDeps = defaultAgentDeps): Promise<PlanTripResponse> {
  const startedAt = deps.now();
  const candidateMatches = matchTrips(
    {
      budgetPerDay: request.budgetPerDay,
      vibes: request.vibes,
      homeAirport: request.homeAirport,
      tripLength: request.tripLength,
      season: request.season,
    },
    CANDIDATE_COUNT,
  );
  const candidates = candidateMatches.map((m) => m.destination);
  const returnDate = addDays(request.departureDate, request.tripLength);

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: buildUserPrompt(request, candidates) }];

  let flightSearchCount = 0;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const deadlineExceeded = deps.now() - startedAt > SOFT_DEADLINE_MS;
    const isLastTurn = turn === MAX_TURNS - 1 || deadlineExceeded;

    const response = await deps.createMessage({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      system: buildSystemPrompt(),
      messages,
      tools: [searchFlightsTool, finalizeRecommendationTool],
      tool_choice: isLastTurn ? { type: "tool", name: "finalize_recommendation" } : { type: "auto" },
    });

    messages.push({ role: "assistant", content: response.content });

    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );

    const finalizeBlock = toolUseBlocks.find((b) => b.name === "finalize_recommendation");
    if (finalizeBlock) {
      return buildResponseFromFinalize(
        finalizeBlock.input as Record<string, unknown>,
        candidates,
        request,
        flightSearchCount,
        false,
      );
    }

    if (toolUseBlocks.length === 0) {
      // Model responded without using a tool; nudge it to finalize.
      break;
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of toolUseBlocks) {
      if (block.name !== "search_flights") continue;
      const input = block.input as Partial<SearchFlightsParams>;

      if (flightSearchCount >= MAX_FLIGHT_SEARCHES) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: "Flight search budget exhausted. Finalize your recommendation now with the data you have.",
        });
        continue;
      }

      flightSearchCount++;
      const offers = await deps.searchFlights({
        origin: request.homeAirport,
        destination: String(input.destination),
        departureDate: request.departureDate,
        returnDate,
        cabinClass: "economy",
      });

      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content:
          offers.length > 0
            ? JSON.stringify(offers.slice(0, 2))
            : "No flight offers found for this route/date. Consider trying an alternate candidate.",
      });
    }

    messages.push({ role: "user", content: toolResults });
  }

  return fallbackResponse(candidates, request, flightSearchCount);
}
