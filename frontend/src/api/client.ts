// ===================================================================
// client.ts — Typed API client for the Jury System backend
// All requests include credentials (session cookie).
// ===================================================================

const BASE_PATH = import.meta.env.VITE_BASE_PATH || '/jurysystem'
const API_BASE = `${BASE_PATH}/api`

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = json?.error ?? {}
    throw new ApiError(err.code ?? 'UNKNOWN', err.message ?? 'Request failed', res.status, err.details)
  }

  return json as T
}

const get  = <T>(path: string)                    => request<T>('GET',    path)
const post = <T>(path: string, body?: unknown)     => request<T>('POST',   path, body)
const put  = <T>(path: string, body?: unknown)     => request<T>('PUT',    path, body)
const del  = <T>(path: string)                    => request<T>('DELETE', path)

// ---- Types ----
export interface User {
  id: string
  username: string
  name: string
  role: 'admin' | 'jury'
  created_at: number
  updated_at: number
}

export interface Category {
  id: string
  name: string
  description: string
  max_score: number
}

export interface Evaluation {
  id: string
  title: string
  description: string
  categories: Category[]
  submission_open_at: number
  submission_close_at: number
  results_publish_at: number
  results_is_published: boolean
  results_published_at: number | null
  jury_assignments: string[]
  created_at: number
  updated_at: number
}

export interface JuryEvaluationSummary {
  id: string
  title: string
  description: string
  submission_open_at: number
  submission_close_at: number
  status: 'upcoming' | 'open' | 'closed'
  has_submission: boolean
}

export interface ScoreEntry {
  category_id: string
  score: number
}

export interface Submission {
  id: string
  evaluation_id: string
  user_id: string
  scores: ScoreEntry[]
  comment: string | null
  submitted_at: number
  updated_at: number
}

export interface CategoryResult {
  id: string
  name: string
  max_score: number
  sum: number
  average: number | null
}

export interface PublicResults {
  evaluation: { id: string; title: string; description: string; published_at: number | null }
  results: {
    submission_count: number
    total_sum: number
    total_max: number
    total_average: number | null
    categories: CategoryResult[]
  }
}

// ---- Auth API ----
export const auth = {
  login:  (username: string, password: string) => post<{ user: User }>('/auth/login', { username, password }),
  logout: ()                                   => post<{ message: string }>('/auth/logout'),
  me:     ()                                   => get<{ user: User }>('/auth/me'),
}

// ---- Admin: Users ----
export const adminUsers = {
  list:   ()                                          => get<{ users: User[] }>('/admin/users'),
  get:    (id: string)                                => get<{ user: User }>(`/admin/users/${id}`),
  create: (data: { username: string; password: string; name: string; role: string }) =>
    post<{ user: User }>('/admin/users', data),
  update: (id: string, data: Partial<{ name: string; role: string; password: string }>) =>
    put<{ user: User }>(`/admin/users/${id}`, data),
  delete: (id: string)                                => del<{ message: string }>(`/admin/users/${id}`),
}

// ---- Admin: Evaluations ----
export type EvalPayload = Omit<Partial<Evaluation>, 'categories'> & {
  categories?: Array<Omit<Category, 'id'> & { id?: string }>
}

export const adminEvals = {
  list:        ()                      => get<{ evaluations: Evaluation[] }>('/admin/evaluations'),
  get:         (id: string)            => get<{ evaluation: Evaluation }>(`/admin/evaluations/${id}`),
  create:      (data: EvalPayload)     => post<{ evaluation: Evaluation }>('/admin/evaluations', data),
  update:      (id: string, data: EvalPayload) => put<{ evaluation: Evaluation }>(`/admin/evaluations/${id}`, data),
  delete:      (id: string)            => del<{ message: string }>(`/admin/evaluations/${id}`),
  setAssignments: (id: string, jury_user_ids: string[]) =>
    put<{ evaluation: Evaluation }>(`/admin/evaluations/${id}/assignments`, { jury_user_ids }),
  publish:     (id: string)            => post<{ evaluation: Evaluation }>(`/admin/evaluations/${id}/publish-results`),
  unpublish:   (id: string)            => post<{ evaluation: Evaluation }>(`/admin/evaluations/${id}/unpublish-results`),
}

// ---- Jury API ----
export const jury = {
  listEvals:     ()           => get<{ evaluations: JuryEvaluationSummary[] }>('/jury/evaluations'),
  getEval:       (id: string) => get<{ evaluation: Evaluation & { status: string }; submission: Submission | null }>(`/jury/evaluations/${id}`),
  getSubmission: (id: string) => get<{ submission: Submission | null }>(`/jury/evaluations/${id}/submission`),
  putSubmission: (id: string, scores: ScoreEntry[], comment?: string) =>
    put<{ submission: Submission }>(`/jury/evaluations/${id}/submission`, { scores, comment }),
}

// ---- Public API ----
export const publicApi = {
  getResults: (id: string) => get<PublicResults>(`/public/evaluations/${id}/results`),
}
