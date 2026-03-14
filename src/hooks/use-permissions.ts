import { useAuth } from './use-auth'

export function usePermissions() {
  const { userProfile } = useAuth()

  const hasPermission = (resource: string, action: string) => {
    // Admin role bypasses strict checks as a fallback safeguard
    if (userProfile?.role === 'Admin') return true

    // Strict RBAC check based on logged in user's permissions array
    return userProfile?.permissions?.includes(`${resource}:${action}`) ?? false
  }

  return { hasPermission }
}
