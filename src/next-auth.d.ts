import 'next-auth'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      pseudo: string
      role: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    pseudo: string
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    pseudo?: string,
    role?: string
  }
}
