import { useSyncExternalStore } from 'react'

export interface DocumentInfo {
  id: string
  name: string
  size: string
  uploadedBy: string
  date: string
  orgId: string
}

export interface OrgUser {
  id: string
  name: string
  email: string
  role: string
  orgId: string
}

let data = {
  documents: [
    {
      id: '1',
      name: 'Relatorio_Financeiro_2024.pdf',
      size: '2.4 MB',
      uploadedBy: 'Admin Silva',
      date: '2024-10-15',
      orgId: 'org-1',
    },
    {
      id: '2',
      name: 'Contratos_Google_Parceria.docx',
      size: '1.1 MB',
      uploadedBy: 'Admin Silva',
      date: '2024-10-18',
      orgId: 'org-1',
    },
    {
      id: '3',
      name: 'Compliance_Bancario_Q3.pdf',
      size: '5.6 MB',
      uploadedBy: 'João Analista',
      date: '2024-10-20',
      orgId: 'org-1',
    },
  ] as DocumentInfo[],
  users: [
    {
      id: '1',
      name: 'Admin Silva',
      email: 'admin@nearbound.com',
      role: 'Administrador',
      orgId: 'org-1',
    },
    {
      id: '2',
      name: 'João Analista',
      email: 'joao@nearbound.com',
      role: 'Analista',
      orgId: 'org-1',
    },
    {
      id: '3',
      name: 'Carlos Visão',
      email: 'carlos@nearbound.com',
      role: 'Visualizador',
      orgId: 'org-1',
    },
  ] as OrgUser[],
}

const listeners = new Set<() => void>()

const notify = () => listeners.forEach((listener) => listener())

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export default function useDataStore() {
  const store = useSyncExternalStore(subscribe, () => data)

  return {
    ...store,
    addDocument: (doc: DocumentInfo) => {
      data = { ...data, documents: [doc, ...data.documents] }
      notify()
    },
    removeDocument: (id: string) => {
      data = { ...data, documents: data.documents.filter((d) => d.id !== id) }
      notify()
    },
    addUser: (u: OrgUser) => {
      data = { ...data, users: [...data.users, u] }
      notify()
    },
  }
}
