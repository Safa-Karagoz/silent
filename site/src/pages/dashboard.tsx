import React, { useEffect } from 'react';
import type { GetServerSidePropsContext } from "next";
import { useSession, signOut } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import VoiceSettings from '../components/VoiceSettings';

const Dashboard = () => {
   const { data: session } = useSession();
   const name = session?.user?.name;

   useEffect(() => {
      document.title = "Dashboard";
   }, []);

   return (
      <div className="min-h-screen bg-gray-50 p-8">
         <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto"
         >
            <h1 className="text-4xl font-bold mb-8">
               Welcome, <span className="text-primary-600">{name}</span>
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <VoiceSettings />
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