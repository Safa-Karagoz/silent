import { MongoDBAdapter } from "@auth/mongodb-adapter"
import NextAuth, { AuthOptions } from "next-auth"
import { Adapter } from "next-auth/adapters"
import GoogleProvider from "next-auth/providers/google";
import client from "@/lib/db/client";

if(!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variable")
}

export const authOptions: AuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    adapter: MongoDBAdapter(client) as Adapter,
    pages: { 
        signIn: "/auth/signin",
        newUser: '/dashboard',
    },
    callbacks: {
        session: async ({ session, user }) => {
            return {
                ...session,
                user: {
                    ...session.user,
                    id: user.id,
                    voiceId: (user as any).selectedVoiceId,
                    voiceName: (user as any).selectedVoiceName,
                }
            }
        }
    }
}

export default NextAuth(authOptions)