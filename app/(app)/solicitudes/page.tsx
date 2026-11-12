'use client'

import { useEffect, useState } from 'react'
import { Badge, Card, Field, inputClass, PageHeader } from '@/components/kit'
import { currency, type Ticket } from '@/lib/mock-data'
import { resolveCancellation, getWorkerRequests, updateTicket, type CancellationRequest } from '@/lib/worker-data'

export default function RequestsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [cancellations, setCancellations] = useState<CancellationRequest[]>([])
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function refresh() {
    const data = await getWorkerRequests()
    setTickets(data.tickets)
    setCancellations(data.cancellations)
  }
  useEffect(() => {
    let active = true
    getWorkerRequests().then((data) => {
      if (active) {
        setTickets(data.tickets)
        setCancellations(data.cancellations)
      }
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las solicitudes.')
    })
    return () => { active = false }
  }, [])

  async function decide(id: string, decision: 'Aprobada' | 'Rechazada') {
    setBusy(true)
    setError('')
    try {
      await resolveCancellation(id, decision)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo resolver la solicitud.')
    } finally {
      setBusy(false)
    }
  }
  async function answerTicket(ticket: Ticket, status: 'En proceso' | 'Resuelto') {
    setBusy(true)
    setError('')
    try {
      await updateTicket(ticket.id, status, responses[ticket.id] || '')
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el ticket.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Solicitudes de trabajadores" subtitle="Responde tickets y decide solicitudes de anulación." />
      {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      <section className="space-y-3">
        <h2 className="font-semibold">Solicitudes de anulación</h2>
        <Card className="divide-y divide-border">
          {!cancellations.length && <p className="p-5 text-sm text-muted-foreground">No hay solicitudes de anulación.</p>}
          {cancellations.map((request) => <div key={request.id} className="space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{request.saleId} · {currency(request.total)}</p><p className="text-sm text-muted-foreground">{request.userName} · {request.date.slice(0, 10)}</p></div><Badge tone={request.status === 'Pendiente' ? 'warning' : request.status === 'Aprobada' ? 'success' : 'muted'}>{request.status}</Badge></div>
            <p className="text-sm"><strong>Motivo:</strong> {request.reason}</p>
            {request.status === 'Pendiente' && <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={() => void decide(request.id, 'Aprobada')} className="min-h-11 rounded-xl bg-success px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">Aprobar y devolver stock</button><button disabled={busy} onClick={() => void decide(request.id, 'Rechazada')} className="min-h-11 rounded-xl border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50">Rechazar</button></div>}
          </div>)}
        </Card>
      </section>
      <section className="space-y-3">
        <h2 className="font-semibold">Tickets de soporte</h2>
        <Card className="divide-y divide-border">
          {!tickets.length && <p className="p-5 text-sm text-muted-foreground">No hay tickets recibidos.</p>}
          {tickets.map((ticket) => <div key={ticket.id} className="space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{ticket.subject}</p><p className="text-sm text-muted-foreground">{ticket.userName} · {ticket.type} · Prioridad {ticket.priority} · {ticket.date.slice(0, 10)}</p></div><Badge tone={ticket.status === 'Resuelto' ? 'success' : ticket.status === 'En proceso' ? 'accent' : 'warning'}>{ticket.status}</Badge></div>
            <p className="text-sm">{ticket.description}</p>
            <Field label="Respuesta para el trabajador"><textarea value={responses[ticket.id] ?? ticket.response ?? ''} onChange={(event) => setResponses((current) => ({ ...current, [ticket.id]: event.target.value }))} className={`${inputClass} min-h-20`} /></Field>
            {ticket.status !== 'Resuelto' && <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={() => void answerTicket(ticket, 'En proceso')} className="min-h-11 rounded-xl border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50">Marcar en proceso</button><button disabled={busy} onClick={() => void answerTicket(ticket, 'Resuelto')} className="min-h-11 rounded-xl bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50">Responder y resolver</button></div>}
          </div>)}
        </Card>
      </section>
    </div>
  )
}
