import NextAuth from 'next-auth'
import { prisma } from './prisma'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  cookies: {
    sessionToken: {
      name: '__Secure-next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
      }
    },
    csrfToken: {
      name: '__Host-next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
      }
    }
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        pseudo: { label: 'Pseudo', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.pseudo || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { pseudo: credentials.pseudo as string },
        })

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        return isValid ? { id: user.id, pseudo: user.pseudo, role: user.role } : null
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.pseudo = user.pseudo
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id as string
      if (token?.pseudo) session.user.pseudo = token.pseudo as string
      if (token?.role) session.user.role = token.role as string
      return session
    },
  },
})
