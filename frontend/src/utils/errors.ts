import { ApiError } from '../api/client'

export function getErrorMessage(e: unknown, fallback = 'Ein Fehler ist aufgetreten.'): string {
  return e instanceof ApiError ? e.message : fallback
}
