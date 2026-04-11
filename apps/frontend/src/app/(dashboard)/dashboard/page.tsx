"use client";

import { useAuthStore } from "@/lib/store/auth.store";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAuth } from "@/contexts/AuthContext"; // Add this import

export default function DashboardPage() {
  // Protect the route and ensure user is authenticated
  const { isAuthenticated, isHydrated } = useAuthGuard();

  // Get the connected user from the auth store
  const { user } = useAuthStore();

  // Get logout function from auth context
  const { logout } = useAuth(); // Add this line

  // Show loading while checking authentication
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  // This shouldn't happen due to useAuthGuard, but just in case
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Non authentifié</div>
      </div>
    );
  }

  // Handle logout with loading state
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
      // You could show a toast notification here
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with logout button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Bienvenue, {user.firstName} {user.lastName}!
        </h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Se déconnecter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Info Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Informations du profil</h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Email:</span> {user.email}
            </p>
            <p>
              <span className="font-medium">Ville:</span>{" "}
              {user.city || "Non renseignée"}
            </p>
            <p>
              <span className="font-medium">Score du profil:</span>{" "}
              {user.profileScore}
            </p>
            <p>
              <span className="font-medium">Solde de crédits:</span>{" "}
              {user.creditBalance}
            </p>
          </div>
        </div>

        {/* Onboarding Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">État d&apos;onboarding</h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Statut:</span>
              {user.isOnboarded ? (
                <span className="text-green-600 ml-2">✓ Terminé</span>
              ) : (
                <span className="text-orange-600 ml-2">
                  En cours (Étape 1)
                </span>
              )}
            </p>
            {!user.isOnboarded && (
              <a
                href={`/onboarding/step-1`}
                className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Continuer l&apos;onboarding
              </a>
            )}
          </div>
        </div>

        {/* Avatar */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Avatar</h2>
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Avatar"
              className="w-24 h-24 rounded-full mx-auto"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center mx-auto">
              <span className="text-2xl font-bold text-gray-600">
                {user.firstName[0]}
                {user.lastName[0]}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* User Object Debug (remove in production) */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Debug - User Object:</h3>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
    </div>
  );
}
