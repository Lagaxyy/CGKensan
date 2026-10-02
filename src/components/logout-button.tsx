'use client'

import { signOut } from 'next-auth/react'

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition"
    >
      Se déconnecter
    </button>
  )
}
