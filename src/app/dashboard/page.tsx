import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-4">Tableau de bord</h1>
      <p className="text-slate-600">
        Bientôt : tes statistiques, tes quiz, ta progression...
      </p>
    </div>
  )
}
