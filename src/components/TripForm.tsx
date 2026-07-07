import { useState } from "react";
import { motion } from "framer-motion";
import {
  Waves,
  Mountain,
  Landmark,
  Music,
  Trees,
  UtensilsCrossed,
  Heart,
  Compass,
  Wallet,
  Calendar,
  CalendarRange,
  ArrowRight,
} from "lucide-react";
import VibeChip from "./VibeChip";
import AirportCombobox from "./AirportCombobox";
import { findAirport } from "../data/airports";
import type { Season, Vibe } from "../data/destinations";
import type { PlanTripRequest } from "../types/trip";

const VIBE_OPTIONS: { value: Vibe; label: string; icon: typeof Waves }[] = [
  { value: "relaxation", label: "Relaxation", icon: Waves },
  { value: "adventure", label: "Adventure", icon: Mountain },
  { value: "culture", label: "Culture", icon: Landmark },
  { value: "nightlife", label: "Nightlife", icon: Music },
  { value: "nature", label: "Nature", icon: Trees },
  { value: "foodie", label: "Foodie", icon: UtensilsCrossed },
  { value: "romance", label: "Romance", icon: Heart },
];

const SEASON_OPTIONS: { value: Season; label: string }[] = [
  { value: "winter", label: "Winter" },
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
  { value: "fall", label: "Fall" },
];

function isoDateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

interface TripFormProps {
  onSubmit: (query: PlanTripRequest) => void;
}

export default function TripForm({ onSubmit }: TripFormProps) {
  const [budgetPerDay, setBudgetPerDay] = useState(120);
  const [vibes, setVibes] = useState<Vibe[]>(["adventure", "nature"]);
  const [homeAirport, setHomeAirport] = useState("JFK");
  const [tripLength, setTripLength] = useState(7);
  const [season, setSeason] = useState<Season>("summer");
  const [departureDate, setDepartureDate] = useState(() => isoDateOffset(30));
  const [error, setError] = useState<string | null>(null);

  const toggleVibe = (vibe: Vibe) => {
    setVibes((prev) => {
      if (prev.includes(vibe)) return prev.filter((v) => v !== vibe);
      if (prev.length >= 4) return prev;
      return [...prev, vibe];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (vibes.length === 0) {
      setError("Pick at least one vibe so we know what you're after.");
      return;
    }
    if (!findAirport(homeAirport)) {
      setError("Pick a home airport from the list.");
      return;
    }
    if (!departureDate || departureDate < isoDateOffset(1)) {
      setError("Pick a departure date at least a day from now.");
      return;
    }
    setError(null);
    onSubmit({
      budgetPerDay,
      vibes,
      homeAirport: homeAirport.trim().toUpperCase(),
      tripLength,
      season,
      departureDate,
    });
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8"
    >
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-500">
          <Compass size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Plan your escape</h2>
          <p className="text-sm text-white/50">Four inputs. One trip idea.</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Vibe */}
        <div>
          <label className="mb-3 block text-sm font-medium text-white/80">
            What's the vibe? <span className="text-white/40">(up to 4)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {VIBE_OPTIONS.map((opt) => (
              <VibeChip
                key={opt.value}
                label={opt.label}
                icon={opt.icon}
                selected={vibes.includes(opt.value)}
                onClick={() => toggleVibe(opt.value)}
              />
            ))}
          </div>
        </div>

        {/* Budget */}
        <div>
          <label className="mb-3 flex items-center justify-between text-sm font-medium text-white/80">
            <span className="flex items-center gap-2">
              <Wallet size={16} /> Budget per day
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">
              ${budgetPerDay}
            </span>
          </label>
          <input
            type="range"
            min={30}
            max={400}
            step={5}
            value={budgetPerDay}
            onChange={(e) => setBudgetPerDay(Number(e.target.value))}
            className="w-full accent-fuchsia-500"
          />
          <div className="mt-1 flex justify-between text-xs text-white/40">
            <span>Shoestring</span>
            <span>Moderate</span>
            <span>Splurge</span>
          </div>
        </div>

        {/* Airport + trip length */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <AirportCombobox value={homeAirport} onChange={setHomeAirport} />

          <div>
            <label className="mb-3 flex items-center justify-between text-sm font-medium text-white/80">
              <span className="flex items-center gap-2">
                <CalendarRange size={16} /> Trip length
              </span>
              <span className="text-white/60">{tripLength} days</span>
            </label>
            <input
              type="range"
              min={2}
              max={21}
              value={tripLength}
              onChange={(e) => setTripLength(Number(e.target.value))}
              className="w-full accent-fuchsia-500"
            />
          </div>
        </div>

        {/* Departure date */}
        <div>
          <label className="mb-3 flex items-center gap-2 text-sm font-medium text-white/80">
            <Calendar size={16} /> Departure date
          </label>
          <input
            type="date"
            value={departureDate}
            min={isoDateOffset(1)}
            onChange={(e) => setDepartureDate(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none [color-scheme:dark] focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/20"
          />
        </div>

        {/* Season */}
        <div>
          <label className="mb-3 block text-sm font-medium text-white/80">When are you traveling?</label>
          <div className="grid grid-cols-4 gap-2">
            {SEASON_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSeason(opt.value)}
                className={`rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                  season === opt.value
                    ? "border-fuchsia-400/60 bg-fuchsia-500/20 text-white"
                    : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 py-4 text-base font-semibold text-white shadow-lg shadow-fuchsia-500/20"
        >
          Find my trip
          <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
        </motion.button>
      </div>
    </motion.form>
  );
}
