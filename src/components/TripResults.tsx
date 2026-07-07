import { motion } from "framer-motion";
import { Plane, Hotel, Wallet, Clock, RotateCcw, Sparkles, ArrowUpRight } from "lucide-react";
import type { AlternateTrip, FlightInfo, HotelInfo, PlanTripResponse } from "../types/trip";

function BookingLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-fuchsia-400 hover:text-fuchsia-300"
    >
      {label}
      <ArrowUpRight size={12} />
    </a>
  );
}

interface TripResultsProps {
  result: PlanTripResponse;
  onReset: () => void;
}

function AgentBadge({ usedFallback }: { usedFallback: boolean }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
      <Sparkles size={12} />
      {usedFallback ? "Heuristic pick" : "Agent pick"}
    </div>
  );
}

function FlightStat({ flight, airport }: { flight: FlightInfo; airport: string }) {
  if (!flight.found) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-1 flex items-center gap-2 text-white/50">
          <Plane size={14} />
          <span className="text-xs uppercase tracking-wide">Flight</span>
        </div>
        <p className="text-lg font-semibold text-white">Estimated</p>
        <p className="text-xs text-white/40">No live fares found for this route</p>
        {flight.bookingLink && <BookingLink href={flight.bookingLink} label="Search flights" />}
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-1 flex items-center gap-2 text-white/50">
        <Plane size={14} />
        <span className="text-xs uppercase tracking-wide">Flight</span>
      </div>
      <p className="text-xl font-semibold text-white">
        {flight.totalAmount != null ? `$${Math.round(flight.totalAmount).toLocaleString()}` : "—"}
      </p>
      <p className="text-xs text-white/40">
        {flight.airline ?? "Unknown carrier"}
        {flight.durationHours != null ? ` · ~${flight.durationHours}h` : ""} to {airport}
      </p>
      {flight.bookingLink && <BookingLink href={flight.bookingLink} label="Book flight" />}
    </div>
  );
}

function HotelStat({ hotel }: { hotel: HotelInfo }) {
  if (!hotel.found) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-1 flex items-center gap-2 text-white/50">
          <Hotel size={14} />
          <span className="text-xs uppercase tracking-wide">Hotel</span>
        </div>
        <p className="text-lg font-semibold text-white">Estimated</p>
        <p className="text-xs text-white/40">No live rates found for this stay</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-1 flex items-center gap-2 text-white/50">
        <Hotel size={14} />
        <span className="text-xs uppercase tracking-wide">Hotel</span>
      </div>
      <p className="text-xl font-semibold text-white">
        {hotel.totalPrice != null ? `$${Math.round(hotel.totalPrice).toLocaleString()}` : "—"}
      </p>
      <p className="text-xs text-white/40">
        {hotel.name ?? "Unknown property"}
        {hotel.pricePerNight != null ? ` · ~$${Math.round(hotel.pricePerNight)}/night` : ""}
      </p>
      {hotel.link && <BookingLink href={hotel.link} label="Book stay" />}
    </div>
  );
}

function AlternateCard({ alternate }: { alternate: AlternateTrip }) {
  const { destination, reason, flight, hotel } = alternate;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/20">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-2xl">{destination.emoji}</span>
        <h3 className="font-semibold text-white">
          {destination.city}, {destination.country}
        </h3>
      </div>
      <p className="mb-3 text-sm text-white/50">{reason}</p>
      <div className="flex flex-wrap items-center gap-4 text-xs text-white/40">
        <span className="flex items-center gap-1">
          <Wallet size={12} /> {destination.costPerDayUSD}/day
        </span>
        <span className="flex items-center gap-1">
          <Plane size={12} />
          {flight.found
            ? `$${Math.round(flight.totalAmount ?? 0).toLocaleString()}${
                flight.durationHours != null ? ` · ~${flight.durationHours}h` : ""
              }`
            : "Estimated only"}
        </span>
        <span className="flex items-center gap-1">
          <Hotel size={12} />
          {hotel.found
            ? `$${Math.round(hotel.totalPrice ?? 0).toLocaleString()}${
                hotel.pricePerNight != null ? ` · ~$${Math.round(hotel.pricePerNight)}/night` : ""
              }`
            : "Estimated only"}
        </span>
      </div>
      {(flight.bookingLink || hotel.link) && (
        <div className="mt-2 flex flex-wrap items-center gap-4">
          {flight.bookingLink && <BookingLink href={flight.bookingLink} label="Book flight" />}
          {hotel.link && <BookingLink href={hotel.link} label="Book stay" />}
        </div>
      )}
    </div>
  );
}

export default function TripResults({ result, onReset }: TripResultsProps) {
  const { chosen, alternates, meta } = result;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-fuchsia-400">
            Your Wayfinder pick
          </p>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            {chosen.destination.city}, {chosen.destination.country}
          </h2>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 hover:border-white/20 hover:text-white"
        >
          <RotateCcw size={14} />
          Start over
        </button>
      </div>

      {/* Primary card */}
      <div
        className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${chosen.destination.gradient} p-[1px] shadow-2xl`}
      >
        <div className="rounded-3xl bg-[#0a0a12]/90 p-6 sm:p-8">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{chosen.destination.emoji}</span>
              <div>
                <p className="text-lg font-medium text-white/90">{chosen.destination.tagline}</p>
              </div>
            </div>
            <AgentBadge usedFallback={meta.usedFallback} />
          </div>

          <p className="mb-6 text-white/60">{chosen.rationale}</p>

          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-1 flex items-center gap-2 text-white/50">
                <Wallet size={14} />
                <span className="text-xs uppercase tracking-wide">Est. trip cost</span>
              </div>
              <p className="text-xl font-semibold text-white">
                ${chosen.estimatedTotalCost.toLocaleString()}
              </p>
              <p className="text-xs text-white/40">
                {chosen.hotel.found
                  ? `$${chosen.destination.costPerDayUSD}/day (food & activities) + hotel + flight`
                  : `$${chosen.destination.costPerDayUSD}/day + flight`}
              </p>
            </div>
            <FlightStat flight={chosen.flight} airport={chosen.destination.airport} />
            <HotelStat hotel={chosen.hotel} />
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-1 flex items-center gap-2 text-white/50">
                <Clock size={14} />
                <span className="text-xs uppercase tracking-wide">Best season</span>
              </div>
              <p className="text-xl font-semibold capitalize text-white">
                {chosen.destination.bestSeasons.join(" / ")}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/40">
              Your itinerary
            </p>
            <div className="flex flex-wrap gap-2">
              {chosen.itinerary.map((h) => (
                <span
                  key={h}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alternates */}
      {alternates.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-white/40">
            Also consider
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {alternates.map((alternate) => (
              <AlternateCard key={alternate.destination.city} alternate={alternate} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
