import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MessageSquare, Users } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { GetServerSidePropsContext } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]';

const AnimatedWaveform = () => {
  // Create multiple wave paths with different phases
  const createWavePath = (phase: number, amplitude: number) => {
    const points = [];
    for (let i = 0; i <= 100; i++) {
      const x = i * (800 / 100);
      const y = amplitude * Math.sin((i / 100) * Math.PI * 4 + phase);
      points.push(`${x},${y}`);
    }
    // Start with M (move to) for the first point, then L (line to) for subsequent points
    return points.map((point, index) => 
      index === 0 ? `M ${point}` : `L ${point}`
    ).join(' ');
  };

  return (
    <svg
      viewBox="-50 -125 900 250"
      className="w-full h-full"
    >
      {/* Create multiple waves with different animations */}
      {[0, Math.PI / 3, Math.PI * 2/3].map((startPhase, index) => (
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
              y: [0, 10, 0]
            }}
            transition={{
              pathLength: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.2
              },
              opacity: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.2
              },
              y: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.2
              }
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
              y: [0, -10, 0]
            }}
            transition={{
              pathLength: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.3
              },
              opacity: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.3
              },
              y: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.3
              }
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
    signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h1 className="text-6xl sm:text-7xl font-bold text-text">
                <span className="text-primary">echo<span className="text-accent">.</span></span>
              </h1>
              <div className="flex items-center gap-4">
                <h2 className="text-4xl font-semibold text-text flex items-center">
                  Freedom to{" "}
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={displayText}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      className="ml-2 inline-block min-w-[120px]"
                    >
                      {displayText}
                    </motion.span>
                  </AnimatePresence>
                </h2>
              </div>
              <p className="text-xl text-text/80 max-w-xl">
                Restore your voice through AI-powered lip synchronization. 
                Participate fully in conversations, meetings, and life.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAuth}
                className="group px-8 py-3 bg-primary text-background rounded-full font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors"
              >
                <span>Get Started</span>
                <motion.span
                  initial={{ x: 0 }}
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.span>
              </motion.button>
            </div>
          </motion.div>

          {/* New animated waveform */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative h-full w-full min-h-[600px] flex items-center justify-center"
          >
            <div className="w-full h-full">
              <AnimatedWaveform />
            </div>
          </motion.div>
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
    props: {}
  };
}