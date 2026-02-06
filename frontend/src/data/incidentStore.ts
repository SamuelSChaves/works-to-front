import type { IncidenteRecord } from '../types/incidents'

const listeners = new Set<(incidents: IncidenteRecord[]) => void>()
let storedIncidents: IncidenteRecord[] = []

export function getStoredIncidents(): IncidenteRecord[] {
  return storedIncidents
}

export function setStoredIncidents(value: IncidenteRecord[]): void {
  storedIncidents = [...value]
  listeners.forEach(listener => listener(storedIncidents))
}

export function subscribeToIncidents(
  listener: (incidents: IncidenteRecord[]) => void
): () => void {
  listener(storedIncidents)
  listeners.add(listener)
  return () => listeners.delete(listener)
}
