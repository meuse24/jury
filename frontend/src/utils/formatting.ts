export function fmtDate(ts: number): string {
  return new Date(ts * 1000).toLocaleString('de-AT')
}
