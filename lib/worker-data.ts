import type { Product, Sale, Ticket } from '@/lib/mock-data'

export type WorkerProduct = Omit<Product, 'cost' | 'supplier'>
export type PaymentMethod = Sale['method']

export type CancellationRequest = {
  id: string
  saleId: string
  userId: string
  userName: string
  reason: string
  status: 'Pendiente' | 'Aprobada' | 'Rechazada'
  date: string
  total: number
}

export type WorkerRequests = {
  tickets: Ticket[]
  cancellations: CancellationRequest[]
}

export type WorkerProfile = {
  name: string
  phone: string
  photo: string
  lowStockAlerts: boolean
  adminNotices: boolean
  ticketReplies: boolean
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const result = await response.json() as T & { error?: string }
  if (!response.ok) throw new Error(result.error || `Error HTTP ${response.status}`)
  return result
}

export async function getProducts(): Promise<WorkerProduct[]> {
  return requestJson<WorkerProduct[]>('/api/products')
}

export async function createSale(input: {
  items: { productId: string; qty: number }[]
  method: PaymentMethod
}): Promise<Sale> {
  return requestJson<Sale>('/api/sales', { method: 'POST', body: JSON.stringify(input) })
}

export async function getSalesByUser(userId: string): Promise<Sale[]> {
  const sales = await requestJson<Sale[]>('/api/sales')
  return sales.filter((sale) => sale.userId === userId)
}

export async function getWorkerRequests(): Promise<WorkerRequests> {
  return requestJson<WorkerRequests>('/api/worker/requests')
}

export async function createTicket(input: {
  subject: string
  type: Ticket['type']
  description: string
  priority: Ticket['priority']
}): Promise<void> {
  await requestJson('/api/worker/requests', {
    method: 'POST',
    body: JSON.stringify({ ...input, kind: 'ticket' }),
  })
}

export async function requestSaleCancellation(saleId: string, reason: string): Promise<void> {
  await requestJson('/api/worker/requests', {
    method: 'POST',
    body: JSON.stringify({ kind: 'cancellation', saleId, reason }),
  })
}

export async function resolveCancellation(id: string, decision: 'Aprobada' | 'Rechazada'): Promise<void> {
  await requestJson('/api/worker/requests', {
    method: 'PATCH',
    body: JSON.stringify({ kind: 'cancellation', id, decision }),
  })
}

export async function updateTicket(id: string, status: 'En proceso' | 'Resuelto', response: string): Promise<void> {
  await requestJson('/api/worker/requests', {
    method: 'PATCH',
    body: JSON.stringify({ kind: 'ticket', id, status, response }),
  })
}

const profilePrefix = 'sdit-worker-profile:'
const profileEvent = 'sdit-worker-profile-change'
const profileCache = new Map<string, WorkerProfile>()
const defaultProfiles = new Map<string, WorkerProfile>()

export function defaultWorkerProfile(name: string): WorkerProfile {
  const cached = defaultProfiles.get(name)
  if (cached) return cached
  const profile: WorkerProfile = {
    name,
    phone: '',
    photo: '',
    lowStockAlerts: true,
    adminNotices: true,
    ticketReplies: true,
  }
  defaultProfiles.set(name, profile)
  return profile
}

function profileKey(name: string) {
  return `${profilePrefix}${name}`
}

export function getWorkerProfile(name: string): WorkerProfile {
  const cached = profileCache.get(name)
  if (cached) return cached
  if (typeof window === 'undefined') {
    return defaultWorkerProfile(name)
  }
  const saved = window.localStorage.getItem(profileKey(name))
  const profile = saved
    ? { ...defaultWorkerProfile(name), ...JSON.parse(saved) as Partial<WorkerProfile> }
    : defaultWorkerProfile(name)
  profileCache.set(name, profile)
  return profile
}

export function subscribeWorkerProfile(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key?.startsWith(profilePrefix)) {
      profileCache.clear()
      onChange()
    }
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(profileEvent, onChange)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(profileEvent, onChange)
  }
}

export function saveWorkerProfile(profile: WorkerProfile) {
  profileCache.set(profile.name, profile)
  window.localStorage.setItem(profileKey(profile.name), JSON.stringify(profile))
  window.dispatchEvent(new Event(profileEvent))
}
