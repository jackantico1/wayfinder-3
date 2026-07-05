import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Loader2 } from "lucide-react";
import TripForm from "./components/TripForm";
import TripResults from "./components/TripResults";
import { planTrip, PlanTripError } from "./lib/api";
import type { PlanTripRequest, PlanTripResponse } from "./types/trip";

const LOADING_STEPS = [
  "Scoring destinations against your vibe...",
  "Checking live flights...",
  "Comparing prices and routes...",
  "Writing your itinerary...",
];

function useLoadingStep(active: boolean) {
  const [stepIndex, setStepIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) {
      setStepIndex(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, LOADING_STEPS.length - 1));
    }, 2200);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [active]);

  return LOADING_STEPS[stepIndex];
}

function LoadingView() {
  const step = useLoadingStep(true);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-4 text-center"
    >
      <Loader2 size={32} className="animate-spin text-fuchsia-400" />
      <p className="text-white/70">{step}</p>
    </motion.div>
  );
}

function App() {
  const [result, setResult] = useState<PlanTripResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (query: PlanTripRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await planTrip(query);
      setResult(response);
    } catch (err) {
      const message = err instanceof PlanTripError ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

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

        {!result && !isLoading && (
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
              Tell Wayfinder your budget, your vibe, and your home airport — our agent checks
              real flights and proposes a trip worth booking.
            </p>
          </motion.div>
        )}

        <main className="flex w-full flex-1 flex-col items-center justify-center pb-10">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <LoadingView key="loading" />
            ) : result ? (
              <TripResults key="results" result={result} onReset={handleReset} />
            ) : (
              <motion.div key="form" className="flex w-full flex-col items-center gap-4">
                {error && (
                  <p className="max-w-2xl rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                    {error}
                  </p>
                )}
                <TripForm onSubmit={handleSubmit} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="mt-auto pt-10 text-center text-xs text-white/30">
          Wayfinder's agent checks a curated set of destinations and real sandbox flight
          data — it's a portfolio demo, not a booking tool.
        </footer>
      </div>
    </div>
  );
}

export default App;
