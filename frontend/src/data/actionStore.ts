import type { AcaoRecord } from '../types/acao'

const listeners = new Set<(actions: AcaoRecord[]) => void>()
let storedActions: AcaoRecord[] = []

export function getStoredActions(): AcaoRecord[] {
  return storedActions
}

export function setStoredActions(value: AcaoRecord[]): void {
  storedActions = [...value]
  listeners.forEach(listener => listener(storedActions))
}

export function subscribeToActions(
  listener: (actions: AcaoRecord[]) => void
): () => void {
  listener(storedActions)
  listeners.add(listener)
  return () => listeners.delete(listener)
}
