import React from 'react';
import LandingModel from '@/components/LandingModel';
import Typewriter from 'typewriter-effect';
import { useRouter } from 'next/router';
import { GetServerSidePropsContext } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]';


export default function LandingPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/30 flex items-center justify-center p-4">
      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-8 flex flex-col justify-center m-10">
          <div className="space-y-4">
            <h1 className="text-7xl font-bold text-text tracking-tight">
              <span className="inline-block text-gradient-to-r from-primary to-accent bg-clip-text">
                SILENT BUDDY
              </span>
            </h1>
            <p className="text-xl text-text font-ReThink font-semibold">
              A companion for your loved one with dementia
            </p>
          </div>

          <button
            onClick={() => { router.push('/auth/signin') }}
            className="mt-2 text-text border border-accent hover:bg-accent transition-all p-2 px-4 rounded-md w-60"
          >
            <span className="font-medium">Sign In</span>
          </button>
        </div>

        <div className="space-y-8">
          <div className="w-full max-w-md mx-auto">
            <LandingModel />
          </div>
          <div className="text-3xl text-text text-center font-ReThink font-semibold">
            <Typewriter
              options={{
                strings: ['How are you?', 'Your AI Companion', 'Always Here to Help'],
                autoStart: true,
                loop: true,
                delay: 75,
                deleteSpeed: 50,
                cursor: '|'
              }}
            />
          </div>
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