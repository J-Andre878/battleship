import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const player = await prisma.player.findUnique({
          where: { username: credentials.username as string }
        })

        if (!player || !player.passwordHash) {
          return null
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          player.passwordHash
        )

        if (!isValid) {
          return null
        }

        return {
          id: player.id.toString(),
          name: player.username,
          email: player.email,
          image: player.avatarUrl,
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        // Buscar o crear usuario con Google
        const existingPlayer = await prisma.player.findUnique({
          where: { googleId: account.providerAccountId }
        })

        if (!existingPlayer) {
          await prisma.player.create({
            data: {
              googleId: account.providerAccountId,
              email: user.email!,
              username: user.name || user.email!.split('@')[0],
              avatarUrl: user.image,
            }
          })
        }
      }
      return true
    },
    async session({ session, token }) {
      if (token.sub) {
        // Buscar el player en la base de datos
        const player = await prisma.player.findFirst({
          where: {
            OR: [
              { id: parseInt(token.sub) },
              { googleId: token.sub },
              { email: session.user?.email || '' }
            ]
          }
        })

        if (player) {
          session.user.id = player.id.toString()
          session.user.name = player.username
          session.user.level = player.level
        }
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt"
  },
  cookies: {
    sessionToken: {
      name: `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false  // false porque usas HTTP (no HTTPS)
      }
    },
    callbackUrl: {
      name: `authjs.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: false
      }
    },
    csrfToken: {
      name: `authjs.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false
      }
    }
  }
})
