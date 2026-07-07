import { describe, expect, it } from "vitest";
import { normalizeProperties } from "./serpapi";

describe("normalizeProperties", () => {
  const sampleProperty = {
    name: "Grand Hotel",
    type: "hotel",
    rate_per_night: { lowest: "$145", extracted_lowest: 145 },
    total_rate: { lowest: "$1,015", extracted_lowest: 1015 },
    hotel_class: 4,
    overall_rating: 4.3,
    link: "https://example.com/grand-hotel",
  };

  it("normalizes a well-formed SerpApi property", () => {
    const offers = normalizeProperties([sampleProperty], "USD");
    expect(offers).toHaveLength(1);
    expect(offers[0]).toEqual({
      name: "Grand Hotel",
      type: "hotel",
      pricePerNight: 145,
      totalPrice: 1015,
      currency: "USD",
      hotelClass: 4,
      rating: 4.3,
      link: "https://example.com/grand-hotel",
    });
  });

  it("maps vacation rental type", () => {
    const offers = normalizeProperties([{ ...sampleProperty, type: "vacation rental" }], "USD");
    expect(offers[0].type).toBe("vacation_rental");
  });

  it("sorts offers by cheapest total first", () => {
    const expensive = { ...sampleProperty, total_rate: { extracted_lowest: 3000 } };
    const cheap = { ...sampleProperty, total_rate: { extracted_lowest: 400 } };
    const offers = normalizeProperties([expensive, cheap], "USD");
    expect(offers.map((o) => o.totalPrice)).toEqual([400, 3000]);
  });

  it("skips malformed entries instead of throwing", () => {
    const offers = normalizeProperties([{ name: "Bad", total_rate: { extracted_lowest: "not-a-number" } }, null, "garbage"], "USD");
    expect(offers).toEqual([]);
  });

  it("returns an empty array for an empty property list", () => {
    expect(normalizeProperties([], "USD")).toEqual([]);
  });
});
