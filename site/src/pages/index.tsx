import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, AudioWaveform, MessageSquare, Users } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { GetServerSidePropsContext } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]';

const WaveAnimation: React.FC = () => {
  return (
    <div className="flex items-center gap-1 h-12">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-primary rounded-full"
          animate={{
            height: ["16px", "32px", "16px"],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({
  icon,
  title,
  description,
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="p-6 rounded-xl bg-background border border-secondary hover:border-primary transition-colors"
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="text-primary">{icon}</div>
      <h3 className="text-xl font-semibold text-text">{title}</h3>
    </div>
    <p className="text-text/80">{description}</p>
  </motion.div>
);

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
      }, 200); // Half of the fade duration
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const handleAuth = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
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
                <span className="text-primary">echo<span className='text-accent'>.</span></span>
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
                {/* <WaveAnimation /> */}
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

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="aspect-square rounded-full bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 flex items-center justify-center">
              <div className="w-4/5 h-4/5 rounded-full bg-gradient-to-tr from-primary/30 via-accent/30 to-secondary/30 flex items-center justify-center relative overflow-hidden group">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <AudioWaveform className="w-1/2 h-1/2 text-primary transform -rotate-12" />
                </motion.div>
              </div>
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