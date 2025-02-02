import type { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            voiceId: string
            voiceName: string
            name?: string | null
            email?: string | null
            image?: string | null
        }
    }
    interface Session extends DefaultSession {
        error?: "RefreshTokenError"
    }
}