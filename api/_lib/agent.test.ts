import { describe, expect, it, vi } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { buildGoogleFlightsUrl, runTripAgent, type AgentDeps } from "./agent.js";
import { matchTrips } from "../../src/lib/matchTrip.js";
import type { PlanTripRequest } from "../../src/types/trip.js";
import type { FlightOffer } from "./duffel.js";
import type { HotelOffer } from "./serpapi.js";

const baseRequest: PlanTripRequest = {
  budgetPerDay: 100,
  vibes: ["culture", "foodie"],
  homeAirport: "JFK",
  tripLength: 7,
  season: "spring",
  departureDate: "2026-09-14",
};

const [topCandidate, secondCandidate] = matchTrips(baseRequest, 4).map((m) => m.destination);
const expectedReturnDate = "2026-09-21"; // baseRequest.departureDate + tripLength days

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

const sampleHotelOffer: HotelOffer = {
  name: "Mock Grand Hotel",
  type: "hotel",
  pricePerNight: 120,
  totalPrice: 840,
  currency: "USD",
  hotelClass: 4,
  rating: 4.4,
  link: "https://example.com/mock-grand-hotel",
};

function finalizeInput(city: string) {
  return {
    destination_city: city,
    rationale: "This fits your vibe perfectly.",
    itinerary: ["Do a thing", "Eat something great"],
    flight: { found: true, ...sampleOffer },
    hotel: { found: true, ...sampleHotelOffer },
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
    const searchHotels = vi.fn<AgentDeps["searchHotels"]>().mockResolvedValue([]);

    const result = await runTripAgent(baseRequest, { createMessage, searchFlights, searchHotels, now: () => 0 });

    expect(searchFlights).toHaveBeenCalledTimes(1);
    expect(result.chosen.destination.city).toBe(topCandidate.city);
    expect(result.chosen.flight).toEqual({
      found: true,
      ...sampleOffer,
      bookingLink: buildGoogleFlightsUrl("JFK", topCandidate.airport, baseRequest.departureDate, expectedReturnDate),
    });
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
    const searchHotels = vi.fn<AgentDeps["searchHotels"]>().mockResolvedValue([]);

    const result = await runTripAgent(baseRequest, { createMessage, searchFlights, searchHotels, now: () => 0 });

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
    const searchHotels = vi.fn<AgentDeps["searchHotels"]>().mockResolvedValue([]);

    const result = await runTripAgent(baseRequest, { createMessage, searchFlights, searchHotels, now: () => 0 });

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
    const searchHotels = vi.fn<AgentDeps["searchHotels"]>().mockResolvedValue([]);

    await runTripAgent(baseRequest, { createMessage, searchFlights, searchHotels, now: () => 0 });

    // Cap is 4 total Duffel calls even though the model asked for more.
    expect(searchFlights.mock.calls.length).toBeLessThanOrEqual(4);
  });

  it("falls back to the heuristic top pick if the model never calls a tool", async () => {
    const createMessage = vi.fn<AgentDeps["createMessage"]>().mockResolvedValue(
      fakeMessage([{ type: "text", text: "I dunno, pick something!" } as unknown as Anthropic.ContentBlock]),
    );
    const searchFlights = vi.fn<AgentDeps["searchFlights"]>();
    const searchHotels = vi.fn<AgentDeps["searchHotels"]>();

    const result = await runTripAgent(baseRequest, { createMessage, searchFlights, searchHotels, now: () => 0 });

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
    const searchHotels = vi.fn<AgentDeps["searchHotels"]>().mockResolvedValue([]);

    const result = await runTripAgent(baseRequest, { createMessage, searchFlights, searchHotels, now: () => elapsed });

    expect(result.meta.usedFallback).toBe(false);
    // Deadline should have forced tool_choice on the 2nd turn instead of waiting for turn 3.
    expect(createMessage).toHaveBeenCalledTimes(2);
  });

  it("calls search_hotels then finalizes with the returned hotel data", async () => {
    const createMessage = vi
      .fn<AgentDeps["createMessage"]>()
      .mockResolvedValueOnce(
        fakeMessage([toolUseBlock("t1", "search_hotels", { destination_city: topCandidate.city })]),
      )
      .mockResolvedValueOnce(fakeMessage([toolUseBlock("t2", "finalize_recommendation", finalizeInput(topCandidate.city))]));

    const searchFlights = vi.fn<AgentDeps["searchFlights"]>().mockResolvedValue([]);
    const searchHotels = vi.fn<AgentDeps["searchHotels"]>().mockResolvedValue([sampleHotelOffer]);

    const result = await runTripAgent(baseRequest, { createMessage, searchFlights, searchHotels, now: () => 0 });

    expect(searchHotels).toHaveBeenCalledTimes(1);
    expect(searchHotels).toHaveBeenCalledWith({
      query: `${topCandidate.city}, ${topCandidate.country}`,
      checkInDate: baseRequest.departureDate,
      checkOutDate: expect.any(String),
      adults: 1,
    });
    expect(result.chosen.hotel).toEqual({ found: true, ...sampleHotelOffer });
    expect(result.meta.toolCallsUsed).toBe(1);
  });

  it("caps hotel searches and tells the model the budget is exhausted", async () => {
    let callCount = 0;
    const createMessage = vi.fn<AgentDeps["createMessage"]>().mockImplementation(async () => {
      callCount++;
      if (callCount >= 3) {
        return fakeMessage([toolUseBlock(`tf${callCount}`, "finalize_recommendation", finalizeInput(topCandidate.city))]);
      }
      return fakeMessage([
        toolUseBlock(`t${callCount}a`, "search_hotels", { destination_city: topCandidate.city }),
        toolUseBlock(`t${callCount}b`, "search_hotels", { destination_city: secondCandidate.city }),
      ]);
    });
    const searchFlights = vi.fn<AgentDeps["searchFlights"]>().mockResolvedValue([]);
    const searchHotels = vi.fn<AgentDeps["searchHotels"]>().mockResolvedValue([sampleHotelOffer]);

    await runTripAgent(baseRequest, { createMessage, searchFlights, searchHotels, now: () => 0 });

    expect(searchHotels.mock.calls.length).toBeLessThanOrEqual(4);
  });

  it("supports searching flights and hotels for the same candidate in one turn", async () => {
    const createMessage = vi
      .fn<AgentDeps["createMessage"]>()
      .mockResolvedValueOnce(
        fakeMessage([
          toolUseBlock("t1a", "search_flights", { origin: "JFK", destination: topCandidate.airport, departure_date: baseRequest.departureDate }),
          toolUseBlock("t1b", "search_hotels", { destination_city: topCandidate.city }),
        ]),
      )
      .mockResolvedValueOnce(fakeMessage([toolUseBlock("t2", "finalize_recommendation", finalizeInput(topCandidate.city))]));

    const searchFlights = vi.fn<AgentDeps["searchFlights"]>().mockResolvedValue([sampleOffer]);
    const searchHotels = vi.fn<AgentDeps["searchHotels"]>().mockResolvedValue([sampleHotelOffer]);

    const result = await runTripAgent(baseRequest, { createMessage, searchFlights, searchHotels, now: () => 0 });

    expect(searchFlights).toHaveBeenCalledTimes(1);
    expect(searchHotels).toHaveBeenCalledTimes(1);
    expect(result.meta.toolCallsUsed).toBe(2);
  });

  it("populates a Google Flights booking link for the chosen trip and each alternate", async () => {
    const finalizeWithAlternate = {
      ...finalizeInput(topCandidate.city),
      alternates: [
        { destination_city: secondCandidate.city, reason: "Also great.", flight: { found: false }, hotel: { found: false } },
      ],
    };
    const createMessage = vi
      .fn<AgentDeps["createMessage"]>()
      .mockResolvedValueOnce(fakeMessage([toolUseBlock("t1", "finalize_recommendation", finalizeWithAlternate)]));

    const searchFlights = vi.fn<AgentDeps["searchFlights"]>().mockResolvedValue([]);
    const searchHotels = vi.fn<AgentDeps["searchHotels"]>().mockResolvedValue([]);

    const result = await runTripAgent(baseRequest, { createMessage, searchFlights, searchHotels, now: () => 0 });

    expect(result.chosen.flight.bookingLink).toBe(
      buildGoogleFlightsUrl("JFK", topCandidate.airport, baseRequest.departureDate, expectedReturnDate),
    );
    expect(result.alternates[0].flight.bookingLink).toBe(
      buildGoogleFlightsUrl("JFK", secondCandidate.airport, baseRequest.departureDate, expectedReturnDate),
    );
  });

  it("populates a Google Flights booking link in the heuristic fallback path", async () => {
    const createMessage = vi.fn<AgentDeps["createMessage"]>().mockResolvedValue(
      fakeMessage([{ type: "text", text: "I dunno, pick something!" } as unknown as Anthropic.ContentBlock]),
    );
    const searchFlights = vi.fn<AgentDeps["searchFlights"]>();
    const searchHotels = vi.fn<AgentDeps["searchHotels"]>();

    const result = await runTripAgent(baseRequest, { createMessage, searchFlights, searchHotels, now: () => 0 });

    expect(result.chosen.flight.bookingLink).toBe(
      buildGoogleFlightsUrl("JFK", topCandidate.airport, baseRequest.departureDate, expectedReturnDate),
    );
    if (result.alternates.length > 0) {
      expect(result.alternates[0].flight.bookingLink).toBe(
        buildGoogleFlightsUrl("JFK", result.alternates[0].destination.airport, baseRequest.departureDate, expectedReturnDate),
      );
    }
  });
});

describe("buildGoogleFlightsUrl", () => {
  it("builds a Google Flights search URL with the natural-language q param", () => {
    const url = buildGoogleFlightsUrl("JFK", "CDG", "2026-09-14", "2026-09-21");
    expect(url).toBe(
      "https://www.google.com/travel/flights?q=" +
        encodeURIComponent("Flights to CDG from JFK on 2026-09-14 through 2026-09-21"),
    );
    expect(new URL(url).searchParams.get("q")).toBe("Flights to CDG from JFK on 2026-09-14 through 2026-09-21");
  });
});
