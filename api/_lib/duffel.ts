export interface FlightOffer {
  totalAmount: number;
  currency: string;
  airline: string;
  durationHours: number;
  departAt: string;
  arriveAt: string;
}

export interface SearchFlightsParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  cabinClass?: "economy" | "premium_economy" | "business" | "first";
}

const DUFFEL_TIMEOUT_MS = 12_000;
const DUFFEL_API_BASE = "https://api.duffel.com";
const DUFFEL_VERSION = "v2";

function parseIsoDurationHours(iso: string | undefined): number {
  if (!iso) return 0;
  const match = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/.exec(iso);
  if (!match) return 0;
  const days = Number(match[1] ?? 0);
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  return Math.round((days * 24 + hours + minutes / 60) * 10) / 10;
}

function normalizeOffers(rawOffers: unknown[]): FlightOffer[] {
  const offers: FlightOffer[] = [];
  for (const raw of rawOffers) {
    if (typeof raw !== "object" || raw === null) continue;
    const offer = raw as Record<string, unknown>;
    const totalAmount = Number(offer.total_amount);
    const currency = String(offer.total_currency ?? "USD");
    const slices = Array.isArray(offer.slices) ? offer.slices : [];
    const firstSlice = slices[0] as Record<string, unknown> | undefined;
    const segments = Array.isArray(firstSlice?.segments) ? (firstSlice!.segments as Record<string, unknown>[]) : [];
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    const airline =
      (firstSegment?.marketing_carrier as Record<string, unknown> | undefined)?.name as string | undefined;

    if (!Number.isFinite(totalAmount) || !firstSegment || !lastSegment) continue;

    offers.push({
      totalAmount,
      currency,
      airline: airline ?? "Unknown carrier",
      durationHours: parseIsoDurationHours(firstSlice?.duration as string | undefined),
      departAt: String(firstSegment.departing_at ?? ""),
      arriveAt: String(lastSegment.arriving_at ?? ""),
    });
  }
  return offers.sort((a, b) => a.totalAmount - b.totalAmount);
}

export async function searchFlights(params: SearchFlightsParams): Promise<FlightOffer[]> {
  const token = process.env.DUFFEL_ACCESS_TOKEN;
  if (!token) throw new Error("DUFFEL_ACCESS_TOKEN is not configured");

  const slices = [{ origin: params.origin, destination: params.destination, departure_date: params.departureDate }];
  if (params.returnDate) {
    slices.push({ origin: params.destination, destination: params.origin, departure_date: params.returnDate });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DUFFEL_TIMEOUT_MS);

  try {
    const response = await fetch(`${DUFFEL_API_BASE}/air/offer_requests?return_offers=true`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "Duffel-Version": DUFFEL_VERSION,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        data: {
          slices,
          passengers: [{ type: "adult" }],
          cabin_class: params.cabinClass ?? "economy",
        },
      }),
    });

    if (!response.ok) return [];

    const body = (await response.json()) as { data?: { offers?: unknown[] } };
    const rawOffers = body.data?.offers ?? [];
    return normalizeOffers(rawOffers);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export { normalizeOffers, parseIsoDurationHours };
