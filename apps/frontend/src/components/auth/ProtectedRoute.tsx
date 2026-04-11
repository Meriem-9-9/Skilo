// 'use client'

// import { useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import { useAuth } from '@/contexts/AuthContext'
// import { ReactNode } from 'react'

// interface ProtectedRouteProps {
//   children: ReactNode
//   redirectTo?: string
// }

// /**
//  * ProtectedRoute
//  *
//  * Enveloppe les pages nécessitant une session active.
//  * En mode simulation : toujours laisser passer (pas de vrai token).
//  * En mode prod : vérifier isAuthenticated depuis AuthContext.
//  *
//  * Usage dans app/(dashboard)/layout.tsx :
//  *   <ProtectedRoute><DashboardShell>{children}</DashboardShell></ProtectedRoute>
//  */
// export function ProtectedRoute({
//   children,
//   redirectTo = '/login',
// }: ProtectedRouteProps) {
//   const { isAuthenticated, isLoading } = useAuth()
//   const router = useRouter()

//   useEffect(() => {
//     // ── MODE SIMULATION : désactivé ──
//     // Commenter la ligne suivante pour activer la protection réelle
//     return

//     // ── MODE PROD : activer ──
//     // if (!isLoading && !isAuthenticated) {
//     //   router.replace(redirectTo)
//     // }
//   }, [isAuthenticated, isLoading, redirectTo, router])

//   // Écran de chargement pendant la vérification du token
//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-[#F5F3FF] flex items-center justify-center">
//         <div className="flex flex-col items-center gap-4">
//           <svg
//             className="animate-spin h-8 w-8 text-[#6D28D9]"
//             xmlns="http://www.w3.org/2000/svg"
//             fill="none"
//             viewBox="0 0 24 24"
//           >
//             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
//           </svg>
//           <p className="text-[#8B7EA8] text-sm font-medium">Vérification de votre session...</p>
//         </div>
//       </div>
//     )
//   }

//   return <>{children}</>
// }
