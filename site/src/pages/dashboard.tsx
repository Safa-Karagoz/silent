import React from 'react';
import type { GetServerSidePropsContext } from "next";
import { useSession, signOut } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { useRouter } from 'next/router';
import Head from 'next/head';

const Dashboard = () => {
    const { data: session } = useSession();
    
    return (
        <>
        <Head>
            <title>Dashboard</title>
        </Head>
        <div className="min-h-screen bg-background-900 text-text p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background-800 hover:bg-background-700 transition-colors"
                    aria-label="Sign out"
                >
                    <span>Sign out</span>
                </button>
            </div>
        </div>
        </>
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