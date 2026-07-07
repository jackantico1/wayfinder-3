export interface HotelOffer {
  name: string;
  type: "hotel" | "vacation_rental";
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  hotelClass?: number;
  rating?: number;
  link?: string;
}

export interface SearchHotelsParams {
  query: string;
  checkInDate: string;
  checkOutDate: string;
  adults?: number;
}

const SERPAPI_TIMEOUT_MS = 12_000;
const SERPAPI_BASE = "https://serpapi.com/search";

function normalizeProperties(rawProperties: unknown[], fallbackCurrency: string): HotelOffer[] {
  const offers: HotelOffer[] = [];
  for (const raw of rawProperties) {
    if (typeof raw !== "object" || raw === null) continue;
    const property = raw as Record<string, unknown>;

    const ratePerNight = property.rate_per_night as Record<string, unknown> | undefined;
    const totalRate = property.total_rate as Record<string, unknown> | undefined;
    const pricePerNight = Number(ratePerNight?.extracted_lowest);
    const totalPrice = Number(totalRate?.extracted_lowest);
    const rawType = property.type;
    const hotelClass = Number(property.hotel_class);
    const rating = Number(property.overall_rating);

    if (!Number.isFinite(totalPrice)) continue;

    offers.push({
      name: typeof property.name === "string" ? property.name : "Unknown property",
      type: rawType === "vacation rental" ? "vacation_rental" : "hotel",
      pricePerNight: Number.isFinite(pricePerNight) ? pricePerNight : 0,
      totalPrice,
      currency: fallbackCurrency,
      hotelClass: Number.isFinite(hotelClass) ? hotelClass : undefined,
      rating: Number.isFinite(rating) ? rating : undefined,
      link: typeof property.link === "string" ? property.link : undefined,
    });
  }
  return offers.sort((a, b) => a.totalPrice - b.totalPrice);
}

export async function searchHotels(params: SearchHotelsParams): Promise<HotelOffer[]> {
  const apiKey = process.env.SERP_API_KEY;
  if (!apiKey) throw new Error("SERP_API_KEY is not configured");

  const currency = "USD";
  const url = new URL(SERPAPI_BASE);
  url.searchParams.set("engine", "google_hotels");
  url.searchParams.set("q", params.query);
  url.searchParams.set("check_in_date", params.checkInDate);
  url.searchParams.set("check_out_date", params.checkOutDate);
  url.searchParams.set("currency", currency);
  url.searchParams.set("adults", String(params.adults ?? 1));
  url.searchParams.set("sort_by", "3");
  url.searchParams.set("api_key", apiKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SERPAPI_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!response.ok) return [];

    const body = (await response.json()) as { error?: string; properties?: unknown[] };
    if (body.error || !Array.isArray(body.properties)) return [];

    return normalizeProperties(body.properties, currency);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export { normalizeProperties };
