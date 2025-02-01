import React, { useEffect } from 'react';
import type { GetServerSidePropsContext } from "next";
import { useSession } from "next-auth/react";
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

  return (
    <div className="h-screen overflow-hidden bg-[hsl(240,60%,99%)] p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="h-full max-w-7xl mx-auto flex flex-col"
      >
        <h1 className="text-4xl font-bold mb-8 text-[hsl(240,36%,4%)] flex-shrink-0">
          Welcome, <span className="text-[hsl(33,70%,63%)]">{name}</span>
        </h1>

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