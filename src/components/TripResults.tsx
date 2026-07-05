import { motion } from "framer-motion";
import { Plane, Wallet, Clock, RotateCcw, Sparkles } from "lucide-react";
import type { TripMatch } from "../lib/matchTrip";

interface TripResultsProps {
  matches: TripMatch[];
  onReset: () => void;
}

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
      <Sparkles size={12} />
      {pct}% match
    </div>
  );
}

export default function TripResults({ matches, onReset }: TripResultsProps) {
  const [top, ...rest] = matches;

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
            {top.destination.city}, {top.destination.country}
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
        className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${top.destination.gradient} p-[1px] shadow-2xl`}
      >
        <div className="rounded-3xl bg-[#0a0a12]/90 p-6 sm:p-8">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{top.destination.emoji}</span>
              <div>
                <p className="text-lg font-medium text-white/90">{top.destination.tagline}</p>
              </div>
            </div>
            <ScoreBadge score={top.score} />
          </div>

          <p className="mb-6 text-white/60">{top.destination.description}</p>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-1 flex items-center gap-2 text-white/50">
                <Wallet size={14} />
                <span className="text-xs uppercase tracking-wide">Est. trip cost</span>
              </div>
              <p className="text-xl font-semibold text-white">
                ${top.estimatedTotalCost.toLocaleString()}
              </p>
              <p className="text-xs text-white/40">${top.destination.costPerDayUSD}/day</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-1 flex items-center gap-2 text-white/50">
                <Plane size={14} />
                <span className="text-xs uppercase tracking-wide">Flight time</span>
              </div>
              <p className="text-xl font-semibold text-white">
                {top.estimatedFlightHours > 0 ? `~${top.estimatedFlightHours}h` : "You're home!"}
              </p>
              <p className="text-xs text-white/40">to {top.destination.airport}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-1 flex items-center gap-2 text-white/50">
                <Clock size={14} />
                <span className="text-xs uppercase tracking-wide">Best season</span>
              </div>
              <p className="text-xl font-semibold capitalize text-white">
                {top.destination.bestSeasons.join(" / ")}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/40">
              Don't miss
            </p>
            <div className="flex flex-wrap gap-2">
              {top.destination.highlights.map((h) => (
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
      {rest.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-white/40">
            Also consider
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {rest.map((m) => (
              <div
                key={m.destination.city}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/20"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{m.destination.emoji}</span>
                    <h3 className="font-semibold text-white">
                      {m.destination.city}, {m.destination.country}
                    </h3>
                  </div>
                  <ScoreBadge score={m.score} />
                </div>
                <p className="mb-3 text-sm text-white/50">{m.destination.tagline}</p>
                <div className="flex items-center gap-4 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <Wallet size={12} /> ${m.estimatedTotalCost.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Plane size={12} /> {m.estimatedFlightHours > 0 ? `~${m.estimatedFlightHours}h` : "Home"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
