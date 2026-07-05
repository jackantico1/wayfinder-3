import type { PlanTripErrorBody, PlanTripRequest, PlanTripResponse } from "../types/trip";

export class PlanTripError extends Error {
  kind: PlanTripErrorBody["kind"];

  constructor(message: string, kind: PlanTripErrorBody["kind"]) {
    super(message);
    this.kind = kind;
  }
}

export async function planTrip(request: PlanTripRequest): Promise<PlanTripResponse> {
  let response: Response;
  try {
    response = await fetch("/api/plan-trip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    throw new PlanTripError("Couldn't reach the trip-planning agent.", "network");
  }

  if (!response.ok) {
    let body: Partial<PlanTripErrorBody> = {};
    try {
      body = await response.json();
    } catch {
      // ignore, fall through to generic error
    }
    throw new PlanTripError(body.error ?? "The trip-planning agent failed.", body.kind ?? "llm_error");
  }

  return (await response.json()) as PlanTripResponse;
}
