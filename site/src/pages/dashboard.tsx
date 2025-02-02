import React, { useEffect, useState, useCallback } from "react";
import type { GetServerSidePropsContext } from "next";
import { useSession, signOut } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import VoiceSettings from "../components/VoiceSettings";
import VideoFeed from "../components/Video";
import AudioPlayer from "../components/AudioPlayer";

import StreamTest from "@/components/StreamTest";
import TranscriptView from "@/components/Transcript";

interface AudioMessage {
  id: string;
  text: string;
  timestamp: number;
}

const Dashboard = () => {
  const { data: session } = useSession();
  const name = session?.user?.name;
  const [messages, setMessages] = useState<AudioMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    document.title = "Dashboard";
  }, []);

  const handleIncomingText = useCallback(async (text: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    const messageId = Date.now().toString();
    
    // Add message to state immediately
    setMessages(prev => [...prev, {
      id: messageId,
      text,
      timestamp: Date.now()
    }]);

    try {
      // Create audio stream URL
      const streamUrl = `/api/tts?text=${encodeURIComponent(text)}`;
      
      // Create audio element and play
      const audio = new Audio(streamUrl);
      await audio.play();
      
    } catch (error) {
      console.error('Error processing text:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
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
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between mb-16"
          >
            <h1 className="text-4xl font-bold text-[hsl(240,36%,4%)]">
              Welcome back,{" "}
              <span className="text-[hsl(33,70%,63%)]">{name}</span>
            </h1>

            <div className="flex flex-row gap-5">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-[hsl(240,36%,4%)] hover:text-[hsl(33,70%,63%)]
                       transition-colors duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign out</span>
              </button>
            </div>
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
                {/* <StreamTest /> */}
                  {/* {messages.map((message) => (
                    <AudioPlayer
                      key={message.id}
                      streamUrl={`/api/tts?text=${encodeURIComponent(message.text)}`}
                      text={message.text}
                    />
                  ))} */}
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
    props: {},
  };
}

export default Dashboard;