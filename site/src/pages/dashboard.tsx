import React, { useEffect } from 'react';
import type { GetServerSidePropsContext } from "next";
import { useSession, signOut } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import VoiceSettings from '../components/VoiceSettings';
import VideoFeed from '../components/Video';
import TranscriptView from '../components/Transcript';

const Dashboard = () => {
  const { data: session } = useSession();
  const name = session?.user?.name;

  useEffect(() => {
    document.title = "Dashboard";
  }, []);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[hsl(240,60%,99%)] to-[hsl(240,60%,95%)]">
      <div className="absolute inset-0 bg-[hsl(33,70%,63%)]/5" />
      
      <div className="relative min-h-screen px-8 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="h-full max-w-6xl mx-auto"
        >
          {/* Simplified Header */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between mb-16"
          >
            <h1 className="text-4xl font-bold text-[hsl(240,36%,4%)]">
              Welcome back, <span className="text-[hsl(33,70%,63%)]">{name}</span>
            </h1>
            
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-[hsl(240,36%,4%)] hover:text-[hsl(33,70%,63%)]
                       transition-colors duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign out</span>
            </button>
          </motion.div>

          {/* Main Content */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="space-y-8">
              <motion.div 
                className="bg-white/80 rounded-2xl shadow-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <VoiceSettings />
              </motion.div>
              
              <motion.div 
                className="bg-white/80 rounded-2xl shadow-sm max-h-[calc(100vh-400px)] overflow-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <TranscriptView />
              </motion.div>
            </div>

            <motion.div 
              className="bg-white/80 rounded-2xl shadow-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <VideoFeed />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return { redirect: { destination: "/auth/signin" } };
  }

  return {
    props: {}
  };
}

export default Dashboard;