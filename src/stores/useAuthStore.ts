import { useSyncExternalStore } from 'react'

export type Role = 'Administrador' | 'Analista' | 'Visualizador'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  orgId: string
  orgName: string
}

let currentUser: User | null = null

const listeners = new Set<() => void>()

const notify = () => {
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export default function useAuthStore() {
  const user = useSyncExternalStore(subscribe, () => currentUser)

  return {
    user,
    login: (u: User) => {
      currentUser = u
      notify()
    },
    logout: () => {
      currentUser = null
      notify()
    },
  }
}
