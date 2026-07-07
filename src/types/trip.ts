import type { Destination, Season, Vibe } from "../data/destinations";

export interface PlanTripRequest {
  budgetPerDay: number;
  vibes: Vibe[];
  homeAirport: string;
  tripLength: number;
  season: Season;
  /** ISO date, e.g. "2026-09-14" */
  departureDate: string;
}

export interface FlightInfo {
  found: boolean;
  totalAmount?: number;
  currency?: string;
  airline?: string;
  durationHours?: number;
  departAt?: string;
  arriveAt?: string;
}

export interface HotelInfo {
  found: boolean;
  name?: string;
  type?: "hotel" | "vacation_rental";
  pricePerNight?: number;
  totalPrice?: number;
  currency?: string;
  hotelClass?: number;
  rating?: number;
  link?: string;
}

export interface RecommendedTrip {
  destination: Destination;
  rationale: string;
  itinerary: string[];
  flight: FlightInfo;
  hotel: HotelInfo;
  estimatedTotalCost: number;
}

export interface AlternateTrip {
  destination: Destination;
  reason: string;
  flight: FlightInfo;
  hotel: HotelInfo;
}

export interface PlanTripResponse {
  chosen: RecommendedTrip;
  alternates: AlternateTrip[];
  meta: { toolCallsUsed: number; usedFallback: boolean };
}

export interface PlanTripErrorBody {
  error: string;
  kind: "timeout" | "no_flights" | "llm_error" | "network" | "bad_request";
}
