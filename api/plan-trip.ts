import type { Vibe } from "../src/data/destinations.js";
import type { PlanTripErrorBody, PlanTripRequest } from "../src/types/trip.js";
import { runTripAgent } from "./_lib/agent.js";

// Minimal structural types so we don't depend on @vercel/node's heavier package
// just for two shapes. Compatible with Vercel's Node function runtime.
interface HandlerRequest {
  method?: string;
  body?: unknown;
}
interface HandlerResponse {
  status(code: number): HandlerResponse;
  json(body: unknown): void;
}

const VIBES: Vibe[] = ["relaxation", "adventure", "culture", "nightlife", "nature", "foodie", "romance"];
const SEASONS = ["winter", "spring", "summer", "fall"];

function sendError(res: HandlerResponse, status: number, body: PlanTripErrorBody) {
  res.status(status).json(body);
}

function validateRequest(body: unknown): PlanTripRequest | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;

  if (typeof b.budgetPerDay !== "number" || b.budgetPerDay <= 0) return null;
  if (!Array.isArray(b.vibes) || b.vibes.length === 0 || !b.vibes.every((v) => VIBES.includes(v as Vibe))) return null;
  if (typeof b.homeAirport !== "string" || !/^[A-Za-z]{3}$/.test(b.homeAirport)) return null;
  if (typeof b.tripLength !== "number" || b.tripLength < 1 || b.tripLength > 60) return null;
  if (typeof b.season !== "string" || !SEASONS.includes(b.season)) return null;
  if (typeof b.departureDate !== "string" || Number.isNaN(Date.parse(b.departureDate))) return null;

  return {
    budgetPerDay: b.budgetPerDay,
    vibes: b.vibes as Vibe[],
    homeAirport: b.homeAirport.toUpperCase(),
    tripLength: b.tripLength,
    season: b.season as PlanTripRequest["season"],
    departureDate: b.departureDate,
  };
}

export default async function handler(req: HandlerRequest, res: HandlerResponse) {
  if (req.method !== "POST") {
    return sendError(res, 405, { error: "Method not allowed", kind: "bad_request" });
  }

  const parsed = validateRequest(req.body);
  if (!parsed) {
    return sendError(res, 400, { error: "Invalid trip request", kind: "bad_request" });
  }

  try {
    const result = await runTripAgent(parsed);
    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("plan-trip failed:", message);
    return sendError(res, 502, { error: "The trip-planning agent failed. Please try again.", kind: "llm_error" });
  }
}
