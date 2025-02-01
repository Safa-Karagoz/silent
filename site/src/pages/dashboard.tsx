import React, { useEffect } from 'react';
import type { GetServerSidePropsContext } from "next";
import { useSession, signOut } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { motion } from 'framer-motion';
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
    signOut({ callbackUrl: '/auth/signin' });
  };

  return (
    <div className="h-screen overflow-hidden bg-[hsl(240,60%,99%)] p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="h-full max-w-7xl mx-auto flex flex-col"
      >
        <div className="flex items-center justify-between mb-8 flex-shrink-0">
          <h1 className="text-4xl font-bold text-[hsl(240,36%,4%)] flex items-center gap-2">
            Welcome, <span className="text-[hsl(33,70%,63%)]">{name}</span>
          </h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-lg text-[hsl(33,70%,63%)] 
                     hover:underline transition-colors duration-200 
                     font-medium focus:outline-none focus:ring-2 
                     focus:ring-[hsl(33,70%,63%)] focus:ring-offset-2"
          >
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 min-h-0">
          <div className="flex flex-col gap-8 min-h-0">
            <div className="flex-shrink-0">
              <VoiceSettings />
            </div>
            <div className="flex-1 min-h-0">
              <TranscriptView />
            </div>
          </div>
          <div className="h-full">
            <VideoFeed />
          </div>
        </div>
      </motion.div>
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