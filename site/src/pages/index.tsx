import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MessageSquare, Users } from "lucide-react";
import { signIn } from "next-auth/react";
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]";

const AnimatedWaveform = () => {
  
  useEffect(() => {
    document.title = "echo.";
  }, []);

  const createWavePath = (phase: number, amplitude: number) => {
    const points = [];
    for (let i = 0; i <= 100; i++) {
      const x = (i - 15) * (2400 / 100);
      const y = amplitude * Math.sin((i / 100) * Math.PI * 6 + phase);
      points.push(`${x},${y}`);
    }
    return points.map((point, index) =>
      index === 0 ? `M ${point}` : `L ${point}`
    ).join(' ');
  };

  return (
    <svg
      viewBox="-400 -125 2000 250"
      className="w-full h-full"
    >
      {[0, Math.PI / 3, Math.PI * 2 / 3].map((startPhase, index) => (
        <g key={index}>
          <motion.path
            d={createWavePath(startPhase, 100)}
            fill="none"
            stroke="hsl(33, 70%, 63%)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: [0, 1, 0],
              opacity: [0.3, 0.7, 0.3],
              y: [0, 10, 0],
            }}
            transition={{
              pathLength: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.2,
              },
              opacity: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.2,
              },
              y: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.2,
              },
            }}
          />
          <motion.path
            d={createWavePath(startPhase + Math.PI, 80)}
            fill="none"
            stroke="hsl(135, 17%, 63%)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: [0, 1, 0],
              opacity: [0.3, 0.6, 0.3],
              y: [0, -10, 0],
            }}
            transition={{
              pathLength: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.3,
              },
              opacity: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.3,
              },
              y: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.3,
              },
            }}
          />
        </g>
      ))}
    </svg>
  );
};

export default function LandingPage() {
  const [displayText, setDisplayText] = useState("Speak");
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    const words = ["Speak", "Connect", "Express", "Engage"];
    let currentIndex = 0;

    const interval = setInterval(() => {
      setIsChanging(true);
      setTimeout(() => {
        currentIndex = (currentIndex + 1) % words.length;
        setDisplayText(words[currentIndex]);
        setIsChanging(false);
      }, 200);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleAuth = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Content centered in page */}
      <div className="max-w-7xl mx-auto mt-8 pt-16">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl sm:text-7xl font-bold text-text mb-6">
              <span className="text-primary">
                echo<span className="text-accent">.</span>
              </span>
            </h1>
            <div className="flex items-center justify-center gap-4 mb-6">
              <h2 className="text-4xl font-semibold text-text flex items-center">
                Freedom to{" "}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={displayText}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.5 }}
                    className="ml-2 inline-block w-[120px]"
                  >
                    {displayText}
                  </motion.span>
                </AnimatePresence>
              </h2>
            </div>

            <p className="text-xl text-text/80 mb-8 mx-auto max-w-2xl">
              Restore your voice through AI-powered lip synchronization.
              Participate fully in conversations, meetings, and life.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAuth}
              className="relative w-3/4 inline-flex items-center justify-center gap-2 py-4 border-2 border-primary text-primary rounded-full  transition-all duration-300 ease-in-out hover:bg-primary hover:text-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span className="relative text-2xl font-semibold z-10">
                Get Started
              </span>
              <motion.span
                initial={{ x: 0 }}
                animate={{ x: [0, 6, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "easeInOut",
                }}
                className="text-xl relative z-10"
              >
                ➜
              </motion.span>
              <span className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 transition-opacity rounded-full"></span>
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Waveform at bottom */}
      <div className="w-screen overflow-hidden">
        <div className="w-full h-48 -translate-x-3 -translate-y-5">
          <AnimatedWaveform />
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (session) {
    return { redirect: { destination: "/dashboard" } };
  }

  return {
    props: {},
  };
}
