import { describe, expect, it } from "vitest";
import { normalizeOffers, parseIsoDurationHours } from "./duffel";

describe("parseIsoDurationHours", () => {
  it("parses hours and minutes", () => {
    expect(parseIsoDurationHours("PT5H30M")).toBe(5.5);
  });

  it("parses days", () => {
    expect(parseIsoDurationHours("P1DT2H")).toBe(26);
  });

  it("returns 0 for missing/invalid input", () => {
    expect(parseIsoDurationHours(undefined)).toBe(0);
    expect(parseIsoDurationHours("not-a-duration")).toBe(0);
  });
});

describe("normalizeOffers", () => {
  const sampleOffer = {
    total_amount: "230.00",
    total_currency: "USD",
    slices: [
      {
        duration: "PT5H30M",
        segments: [
          {
            departing_at: "2026-09-14T08:00:00",
            arriving_at: "2026-09-14T13:30:00",
            marketing_carrier: { name: "Mock Airways" },
          },
        ],
      },
    ],
  };

  it("normalizes a well-formed Duffel offer", () => {
    const offers = normalizeOffers([sampleOffer]);
    expect(offers).toHaveLength(1);
    expect(offers[0]).toEqual({
      totalAmount: 230,
      currency: "USD",
      airline: "Mock Airways",
      durationHours: 5.5,
      departAt: "2026-09-14T08:00:00",
      arriveAt: "2026-09-14T13:30:00",
    });
  });

  it("sorts offers by cheapest first", () => {
    const expensive = { ...sampleOffer, total_amount: "900.00" };
    const cheap = { ...sampleOffer, total_amount: "120.00" };
    const offers = normalizeOffers([expensive, cheap]);
    expect(offers.map((o) => o.totalAmount)).toEqual([120, 900]);
  });

  it("skips malformed offers instead of throwing", () => {
    const offers = normalizeOffers([{ total_amount: "not-a-number", slices: [] }, null, "garbage"]);
    expect(offers).toEqual([]);
  });

  it("returns an empty array for an empty offer list", () => {
    expect(normalizeOffers([])).toEqual([]);
  });
});
