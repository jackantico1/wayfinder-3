import { useState } from "react";
import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import TripForm from "./components/TripForm";
import TripResults from "./components/TripResults";
import { matchTrips, type TripMatch, type TripQuery } from "./lib/matchTrip";

function App() {
  const [matches, setMatches] = useState<TripMatch[] | null>(null);

  const handleSubmit = (query: TripQuery) => {
    setMatches(matchTrips(query));
  };

  const handleReset = () => setMatches(null);

  return (
    <div className="bg-grid relative min-h-screen overflow-x-hidden bg-[#0a0a12]">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-fuchsia-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 right-0 h-[400px] w-[400px] rounded-full bg-indigo-600/20 blur-[120px]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center px-4 py-10 sm:px-6">
        {/* Nav */}
        <header className="mb-10 flex w-full max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-500">
              <Compass size={18} className="text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">Wayfinder</span>
          </div>
          <a
            href="https://github.com/jackantico1/wayfinder-3"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-white/40 hover:text-white/70"
          >
            View on GitHub
          </a>
        </header>

        {!matches && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10 max-w-2xl text-center"
          >
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Not sure where to go next?
            </h1>
            <p className="mt-4 text-lg text-white/50">
              Tell Wayfinder your budget, your vibe, and your home airport — we'll propose
              a trip worth booking.
            </p>
          </motion.div>
        )}

        <main className="flex w-full flex-1 flex-col items-center justify-center pb-10">
          {matches ? (
            <TripResults matches={matches} onReset={handleReset} />
          ) : (
            <TripForm onSubmit={handleSubmit} />
          )}
        </main>

        <footer className="mt-auto pt-10 text-center text-xs text-white/30">
          Wayfinder is a concept demo — trip suggestions are generated from a curated
          sample dataset, not live pricing or availability.
        </footer>
      </div>
    </div>
  );
}

export default App;
