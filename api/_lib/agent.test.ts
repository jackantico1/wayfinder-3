import { describe, expect, it, vi } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { runTripAgent, type AgentDeps } from "./agent";
import { matchTrips } from "../../src/lib/matchTrip";
import type { PlanTripRequest } from "../../src/types/trip";
import type { FlightOffer } from "./duffel";

const baseRequest: PlanTripRequest = {
  budgetPerDay: 100,
  vibes: ["culture", "foodie"],
  homeAirport: "JFK",
  tripLength: 7,
  season: "spring",
  departureDate: "2026-09-14",
};

const [topCandidate, secondCandidate] = matchTrips(baseRequest, 4).map((m) => m.destination);

function fakeMessage(content: Anthropic.ContentBlock[]): Anthropic.Message {
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-test",
    content,
    stop_reason: content.some((c) => c.type === "tool_use") ? "tool_use" : "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 0, output_tokens: 0 },
  } as unknown as Anthropic.Message;
}

function toolUseBlock(id: string, name: string, input: Record<string, unknown>): Anthropic.ContentBlock {
  return { type: "tool_use", id, name, input } as unknown as Anthropic.ContentBlock;
}

const sampleOffer: FlightOffer = {
  totalAmount: 450,
  currency: "USD",
  airline: "Mock Airways",
  durationHours: 6.5,
  departAt: "2026-09-14T08:00:00",
  arriveAt: "2026-09-14T14:30:00",
};

function finalizeInput(city: string) {
  return {
    destination_city: city,
    rationale: "This fits your vibe perfectly.",
    itinerary: ["Do a thing", "Eat something great"],
    flight: { found: true, ...sampleOffer },
    alternates: [],
  };
}

describe("runTripAgent", () => {
  it("calls search_flights then finalizes with the returned flight data", async () => {
    const createMessage = vi
      .fn<AgentDeps["createMessage"]>()
      .mockResolvedValueOnce(
        fakeMessage([toolUseBlock("t1", "search_flights", { origin: "JFK", destination: topCandidate.airport, departure_date: baseRequest.departureDate })]),
      )
      .mockResolvedValueOnce(fakeMessage([toolUseBlock("t2", "finalize_recommendation", finalizeInput(topCandidate.city))]));

    const searchFlights = vi.fn<AgentDeps["searchFlights"]>().mockResolvedValue([sampleOffer]);

    const result = await runTripAgent(baseRequest, { createMessage, searchFlights, now: () => 0 });

    expect(searchFlights).toHaveBeenCalledTimes(1);
    expect(result.chosen.destination.city).toBe(topCandidate.city);
    expect(result.chosen.flight).toEqual({ found: true, ...sampleOffer });
    expect(result.meta.usedFallback).toBe(false);
    expect(result.meta.toolCallsUsed).toBe(1);
  });

  it("tries an alternate candidate when the first search returns no offers", async () => {
    const createMessage = vi
      .fn<AgentDeps["createMessage"]>()
      .mockResolvedValueOnce(
        fakeMessage([toolUseBlock("t1", "search_flights", { origin: "JFK", destination: topCandidate.airport, departure_date: baseRequest.departureDate })]),
      )
      .mockResolvedValueOnce(
        fakeMessage([toolUseBlock("t2", "search_flights", { origin: "JFK", destination: secondCandidate.airport, departure_date: baseRequest.departureDate })]),
      )
      .mockResolvedValueOnce(fakeMessage([toolUseBlock("t3", "finalize_recommendation", finalizeInput(secondCandidate.city))]));

    const searchFlights = vi
      .fn<AgentDeps["searchFlights"]>()
      .mockResolvedValueOnce([]) // no offers for top candidate
      .mockResolvedValueOnce([sampleOffer]);

    const result = await runTripAgent(baseRequest, { createMessage, searchFlights, now: () => 0 });

    expect(searchFlights).toHaveBeenCalledTimes(2);
    expect(result.chosen.destination.city).toBe(secondCandidate.city);
  });

  it("forces finalize_recommendation on the last allowed turn via tool_choice", async () => {
    const createMessage = vi.fn<AgentDeps["createMessage"]>().mockImplementation(async (params) => {
      if (params.tool_choice && (params.tool_choice as { type: string }).type === "tool") {
        return fakeMessage([toolUseBlock("tf", "finalize_recommendation", finalizeInput(topCandidate.city))]);
      }
      // Keep calling search_flights forever if not forced — simulates a model that won't stop.
      return fakeMessage([toolUseBlock("tn", "search_flights", { origin: "JFK", destination: topCandidate.airport, departure_date: baseRequest.departureDate })]);
    });
    const searchFlights = vi.fn<AgentDeps["searchFlights"]>().mockResolvedValue([sampleOffer]);

    const result = await runTripAgent(baseRequest, { createMessage, searchFlights, now: () => 0 });

    expect(result.meta.usedFallback).toBe(false);
    expect(result.chosen.destination.city).toBe(topCandidate.city);
    // 3 total turns max: 2 search turns + 1 forced finalize turn.
    expect(createMessage).toHaveBeenCalledTimes(3);
  });

  it("caps flight searches and tells the model the budget is exhausted", async () => {
    let callCount = 0;
    const createMessage = vi.fn<AgentDeps["createMessage"]>().mockImplementation(async () => {
      callCount++;
      if (callCount >= 3) {
        return fakeMessage([toolUseBlock(`tf${callCount}`, "finalize_recommendation", finalizeInput(topCandidate.city))]);
      }
      // Ask for two flight searches per turn to exceed the cap of 4 quickly.
      return fakeMessage([
        toolUseBlock(`t${callCount}a`, "search_flights", { origin: "JFK", destination: topCandidate.airport, departure_date: baseRequest.departureDate }),
        toolUseBlock(`t${callCount}b`, "search_flights", { origin: "JFK", destination: secondCandidate.airport, departure_date: baseRequest.departureDate }),
      ]);
    });
    const searchFlights = vi.fn<AgentDeps["searchFlights"]>().mockResolvedValue([sampleOffer]);

    await runTripAgent(baseRequest, { createMessage, searchFlights, now: () => 0 });

    // Cap is 4 total Duffel calls even though the model asked for more.
    expect(searchFlights.mock.calls.length).toBeLessThanOrEqual(4);
  });

  it("falls back to the heuristic top pick if the model never calls a tool", async () => {
    const createMessage = vi.fn<AgentDeps["createMessage"]>().mockResolvedValue(
      fakeMessage([{ type: "text", text: "I dunno, pick something!" } as unknown as Anthropic.ContentBlock]),
    );
    const searchFlights = vi.fn<AgentDeps["searchFlights"]>();

    const result = await runTripAgent(baseRequest, { createMessage, searchFlights, now: () => 0 });

    expect(result.meta.usedFallback).toBe(true);
    expect(result.chosen.destination.city).toBe(topCandidate.city);
    expect(searchFlights).not.toHaveBeenCalled();
  });

  it("force-finalizes once the soft deadline is exceeded", async () => {
    let elapsed = 0;
    const createMessage = vi.fn<AgentDeps["createMessage"]>().mockImplementation(async (params) => {
      elapsed += 30_000; // jump past the soft deadline after the first call
      if (params.tool_choice && (params.tool_choice as { type: string }).type === "tool") {
        return fakeMessage([toolUseBlock("tf", "finalize_recommendation", finalizeInput(topCandidate.city))]);
      }
      return fakeMessage([toolUseBlock("tn", "search_flights", { origin: "JFK", destination: topCandidate.airport, departure_date: baseRequest.departureDate })]);
    });
    const searchFlights = vi.fn<AgentDeps["searchFlights"]>().mockResolvedValue([sampleOffer]);

    const result = await runTripAgent(baseRequest, { createMessage, searchFlights, now: () => elapsed });

    expect(result.meta.usedFallback).toBe(false);
    // Deadline should have forced tool_choice on the 2nd turn instead of waiting for turn 3.
    expect(createMessage).toHaveBeenCalledTimes(2);
  });
});
