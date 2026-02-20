import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { publicApi, PublicResults, CandidateResult, CategoryResult, ApiError } from '../api/client'
import Spinner from '../components/Spinner'
import Alert from '../components/Alert'

// =====================================================================
// SIMPLE MODE  – categories revealed one by one
// CANDIDATES MODE – candidates revealed in reverse rank order (suspense)
// =====================================================================

export default function PublicResultsPage() {
  const { id }  = useParams<{ id: string }>()
  const [data, setData]    = useState<PublicResults | null>(null)
  const [loading, setLoad] = useState(true)
  const [error, setError]  = useState('')

  useEffect(() => {
    publicApi.getResults(id!)
      .then(setData)
      .catch(e => setError(e instanceof ApiError && e.status === 404
        ? 'Die Ergebnisse sind noch nicht verfügbar oder diese Wertung existiert nicht.'
        : 'Fehler beim Laden der Ergebnisse.'))
      .finally(() => setLoad(false))
  }, [id])

  if (loading) return <Spinner />
  if (error || !data) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="text-center space-y-3">
        <div className="text-6xl">🏆</div>
        <Alert type="info">{error}</Alert>
      </div>
    </div>
  )

  return data.mode === 'candidates'
    ? <CandidatesReveal data={data} />
    : <SimpleReveal data={data} />
}

// =====================================================================
// SIMPLE MODE
// =====================================================================

type SimplePhase = 'intro' | 'category' | 'total'

function SimpleReveal({ data }: { data: PublicResults }) {
  const { evaluation, results } = data
  const cats    = results!.categories
  const totalMax = cats.reduce((s, c) => s + c.max_score, 0)

  const [phase, setPhase]           = useState<SimplePhase>('intro')
  const [revealedCount, setRevealed] = useState(0)
  const [barWidth, setBarWidth]      = useState(0)
  const [scoreVisible, setScoreVis]  = useState(false)
  const [totalVisible, setTotalVis]  = useState(false)
  const [starsVisible, setStarsVis]  = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const currentCat: CategoryResult | undefined = cats[revealedCount]
  const pct = currentCat
    ? Math.min(100, ((currentCat.average ?? 0) / currentCat.max_score) * 100)
    : 0

  const startReveal = () => {
    setPhase('category'); setRevealed(0); setBarWidth(0); setScoreVis(false)
    animateBar(pct)
  }

  const animateBar = (targetPct: number) => {
    setBarWidth(0); setScoreVis(false)
    timerRef.current = setTimeout(() => {
      setBarWidth(targetPct)
      timerRef.current = setTimeout(() => setScoreVis(true), 800)
    }, 300)
  }

  const next = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const nextIdx = revealedCount + 1
    if (nextIdx >= cats.length) {
      setPhase('total'); setTotalVis(false); setStarsVis(false)
      timerRef.current = setTimeout(() => {
        setTotalVis(true)
        timerRef.current = setTimeout(() => setStarsVis(true), 600)
      }, 400)
    } else {
      setRevealed(nextIdx); setBarWidth(0); setScoreVis(false)
      timerRef.current = setTimeout(() => {
        const cat = cats[nextIdx]
        const p = Math.min(100, ((cat.average ?? 0) / cat.max_score) * 100)
        setBarWidth(p)
        timerRef.current = setTimeout(() => setScoreVis(true), 800)
      }, 300)
    }
  }

  const restart = () => {
    setPhase('intro'); setRevealed(0); setBarWidth(0)
    setScoreVis(false); setTotalVis(false); setStarsVis(false)
  }

  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 px-4">
        <div className="space-y-3">
          <div className="text-7xl">🏆</div>
          <h1 className="text-4xl font-bold text-gray-900">{evaluation.title}</h1>
          {evaluation.description && <p className="text-gray-500 text-lg max-w-md">{evaluation.description}</p>}
        </div>
        <div className="flex gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-indigo-700">{cats.length}</div>
            <div className="text-sm text-gray-500 mt-1">Kategorien</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-indigo-700">
              {results!.submission_count}
              {data.total_jury_count && data.total_jury_count > results!.submission_count
                ? <span className="text-2xl text-amber-500"> / {data.total_jury_count}</span>
                : null}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {data.total_jury_count && data.total_jury_count > results!.submission_count
                ? 'Wertungen abgegeben'
                : 'Jury-Wertungen'}
            </div>
          </div>
          <div>
            <div className="text-4xl font-bold text-indigo-700">{totalMax}</div>
            <div className="text-sm text-gray-500 mt-1">Max. Punkte</div>
          </div>
        </div>
        <button onClick={startReveal}
          className="bg-indigo-700 hover:bg-indigo-800 active:scale-95 text-white text-xl font-bold px-10 py-4 rounded-2xl shadow-lg transition-transform">
          Ergebnisse enthüllen →
        </button>
        {evaluation.published_at && (
          <p className="text-xs text-gray-400">
            Veröffentlicht: {new Date(evaluation.published_at * 1000).toLocaleString('de-AT')}
          </p>
        )}
      </div>
    )
  }

  if (phase === 'category' && currentCat) {
    const colorClass = barWidth >= 80 ? 'bg-green-500' : barWidth >= 50 ? 'bg-indigo-500' : 'bg-amber-500'
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 space-y-8">
        <div className="flex gap-2">
          {cats.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all duration-300 ${
              i < revealedCount ? 'w-8 bg-indigo-600' : i === revealedCount ? 'w-8 bg-indigo-400' : 'w-4 bg-gray-200'
            }`} />
          ))}
        </div>
        <div className="text-sm text-gray-400 font-medium tracking-widest uppercase">
          Kategorie {revealedCount + 1} von {cats.length}
        </div>
        <div className="w-full max-w-lg bg-white shadow-2xl rounded-2xl p-8 space-y-6 text-center">
          <h2 className="text-3xl font-bold text-gray-800">{currentCat.name}</h2>
          <div className="space-y-2">
            <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden">
              <div className={`h-6 rounded-full transition-all duration-[1200ms] ease-out ${colorClass}`}
                style={{ width: `${barWidth}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>0</span><span>max. {currentCat.max_score}</span>
            </div>
          </div>
          <div className={`transition-all duration-500 ${scoreVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
            <div className="text-6xl font-black text-indigo-700">{currentCat.average?.toFixed(2) ?? '—'}</div>
            <div className="text-gray-400 text-sm mt-1">Ø Punkte · Summe: {currentCat.sum}</div>
          </div>
        </div>
        <button onClick={next} disabled={!scoreVisible}
          className="bg-indigo-700 hover:bg-indigo-800 active:scale-95 disabled:opacity-40 text-white text-lg font-semibold px-8 py-3 rounded-xl shadow transition-all">
          {revealedCount + 1 < cats.length ? 'Nächste Kategorie →' : 'Gesamtergebnis →'}
        </button>
      </div>
    )
  }

  // Finale
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 space-y-8 text-center">
      <div className={`text-6xl transition-all duration-700 ${starsVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
        ⭐🏆⭐
      </div>
      <h1 className="text-2xl font-bold text-gray-700">{evaluation.title}</h1>
      <div className={`transition-all duration-700 ${totalVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="bg-indigo-700 text-white rounded-3xl px-16 py-10 shadow-2xl space-y-2">
          <div className="text-sm uppercase tracking-widest text-indigo-300">Gesamtergebnis</div>
          <div className="text-8xl font-black">{results!.total_average?.toFixed(2) ?? '—'}</div>
          <div className="text-indigo-200">von max. {totalMax} Punkten</div>
          <div className="text-indigo-300 text-sm mt-2">
            {data.total_jury_count && data.total_jury_count > results!.submission_count
              ? `${results!.submission_count} von ${data.total_jury_count} Jury-Wertungen`
              : `${results!.submission_count} Jury-Wertungen`}
          </div>
        </div>
      </div>
      <div className={`w-full max-w-md space-y-2 transition-all duration-700 delay-300 ${starsVisible ? 'opacity-100' : 'opacity-0'}`}>
        {cats.map(cat => {
          const p = Math.min(100, ((cat.average ?? 0) / cat.max_score) * 100)
          return (
            <div key={cat.id} className="bg-white rounded-xl shadow px-4 py-3 flex items-center gap-4">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700 mb-1">{cat.name}</div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${p}%` }} />
                </div>
              </div>
              <div className="text-lg font-bold text-indigo-700 w-16 text-right">
                {cat.average?.toFixed(2) ?? '—'}
                <span className="text-xs text-gray-400 font-normal">/{cat.max_score}</span>
              </div>
            </div>
          )
        })}
      </div>
      <button onClick={restart}
        className="text-sm text-gray-400 hover:text-indigo-600 hover:underline transition-colors">
        ↺ Nochmal abspielen
      </button>
    </div>
  )
}

// =====================================================================
// CANDIDATES MODE
// Candidates sorted best-first by API (rank 1 = best).
// Reveal in reverse order (worst first) for suspense, then winner last.
// =====================================================================

type CandPhase = 'intro' | 'candidate' | 'winner'

function CandidatesReveal({ data }: { data: PublicResults }) {
  const { evaluation } = data
  const allCandidates  = data.candidates ?? []
  // Reverse: show lowest rank last (winner = most suspense)
  const revealOrder    = [...allCandidates].reverse()

  const [phase, setPhase]               = useState<CandPhase>('intro')
  const [revealIdx, setRevealIdx]       = useState(0)     // index in revealOrder
  const [barWidth, setBarWidth]         = useState(0)
  const [scoreVisible, setScoreVis]     = useState(false)
  const [winnerVisible, setWinnerVis]   = useState(false)
  const [confettiVisible, setConfetti]  = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const currentCand: CandidateResult | undefined = revealOrder[revealIdx]
  const maxPerEntry = currentCand?.results.max_per_entry ?? 1
  const avgPct      = currentCand
    ? Math.min(100, ((currentCand.results.total_average ?? 0) / maxPerEntry) * 100)
    : 0

  const animateBar = (targetPct: number) => {
    setBarWidth(0); setScoreVis(false)
    timerRef.current = setTimeout(() => {
      setBarWidth(targetPct)
      timerRef.current = setTimeout(() => setScoreVis(true), 900)
    }, 400)
  }

  const startReveal = () => {
    setPhase('candidate'); setRevealIdx(0)
    animateBar(Math.min(100, ((revealOrder[0]?.results.total_average ?? 0) / (revealOrder[0]?.results.max_per_entry ?? 1)) * 100))
  }

  const next = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const nextIdx = revealIdx + 1
    if (nextIdx >= revealOrder.length) {
      // Finale – winner
      setPhase('winner'); setWinnerVis(false); setConfetti(false)
      timerRef.current = setTimeout(() => {
        setWinnerVis(true)
        timerRef.current = setTimeout(() => setConfetti(true), 700)
      }, 400)
    } else {
      setRevealIdx(nextIdx); setBarWidth(0); setScoreVis(false)
      timerRef.current = setTimeout(() => {
        const cand = revealOrder[nextIdx]
        const p = Math.min(100, ((cand.results.total_average ?? 0) / (cand.results.max_per_entry ?? 1)) * 100)
        setBarWidth(p)
        timerRef.current = setTimeout(() => setScoreVis(true), 900)
      }, 400)
    }
  }

  const restart = () => {
    setPhase('intro'); setRevealIdx(0); setBarWidth(0)
    setScoreVis(false); setWinnerVis(false); setConfetti(false)
  }

  const winner = allCandidates.find(c => c.rank === 1)
  const juryCount = data.total_jury_count ?? 0

  // ---- INTRO ----
  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 px-4">
        <div className="space-y-3">
          <div className="text-7xl">🏆</div>
          <h1 className="text-4xl font-bold text-gray-900">{evaluation.title}</h1>
          {evaluation.description && <p className="text-gray-500 text-lg max-w-md">{evaluation.description}</p>}
        </div>
        <div className="flex gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-indigo-700">{allCandidates.length}</div>
            <div className="text-sm text-gray-500 mt-1">Kandidaten</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-indigo-700">{juryCount}</div>
            <div className="text-sm text-gray-500 mt-1">Jury-Mitglieder</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-indigo-700">{allCandidates[0]?.results.max_per_entry ?? 0}</div>
            <div className="text-sm text-gray-500 mt-1">Max. Punkte</div>
          </div>
        </div>
        <button onClick={startReveal}
          className="bg-indigo-700 hover:bg-indigo-800 active:scale-95 text-white text-xl font-bold px-10 py-4 rounded-2xl shadow-lg transition-transform">
          Rangfolge enthüllen →
        </button>
        {evaluation.published_at && (
          <p className="text-xs text-gray-400">
            Veröffentlicht: {new Date(evaluation.published_at * 1000).toLocaleString('de-AT')}
          </p>
        )}
      </div>
    )
  }

  // ---- CANDIDATE REVEAL ----
  if (phase === 'candidate' && currentCand) {
    const colorClass = barWidth >= 80 ? 'bg-green-500' : barWidth >= 50 ? 'bg-indigo-500' : 'bg-amber-500'
    const remaining  = revealOrder.length - revealIdx - 1
    const maxPE      = currentCand.results.max_per_entry

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 space-y-6">
        {/* Progress dots */}
        <div className="flex gap-2">
          {revealOrder.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all duration-300 ${
              i < revealIdx ? 'w-8 bg-indigo-600' : i === revealIdx ? 'w-8 bg-indigo-400' : 'w-4 bg-gray-200'
            }`} />
          ))}
        </div>

        {remaining === 0 ? (
          <div className="text-sm text-amber-600 font-semibold tracking-widest uppercase animate-pulse">
            Letzter Kandidat...
          </div>
        ) : (
          <div className="text-sm text-gray-400 font-medium tracking-widest uppercase">
            Platz {currentCand.rank} von {revealOrder.length}
          </div>
        )}

        {/* Candidate card */}
        <div className="w-full max-w-lg bg-white shadow-2xl rounded-2xl p-8 space-y-5 text-center">
          <div className="text-5xl font-black text-gray-200">#{currentCand.rank}</div>
          <h2 className="text-3xl font-bold text-gray-800">{currentCand.name}</h2>
          {currentCand.description && (
            <p className="text-gray-500 text-sm">{currentCand.description}</p>
          )}

          {/* Total score bar */}
          <div className="space-y-2">
            <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
              <div className={`h-8 rounded-full transition-all duration-[1400ms] ease-out ${colorClass}`}
                style={{ width: `${barWidth}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>0</span><span>max. {maxPE}</span>
            </div>
          </div>

          {/* Score reveal */}
          <div className={`transition-all duration-500 ${scoreVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
            <div className="text-7xl font-black text-indigo-700">
              {currentCand.results.total_average?.toFixed(2) ?? '—'}
            </div>
            <div className="text-gray-400 text-sm mt-1">
              Ø Gesamtpunkte ·{' '}
              {juryCount > 0 && currentCand.results.submission_count < juryCount
                ? <span className="text-amber-500 font-medium">{currentCand.results.submission_count} von {juryCount} Wertungen</span>
                : `${currentCand.results.submission_count} Wertungen`}
            </div>

            {/* Category breakdown */}
            <div className="mt-4 space-y-1.5 text-left">
              {currentCand.results.categories.map(cat => {
                const p = Math.min(100, ((cat.average ?? 0) / cat.max_score) * 100)
                return (
                  <div key={cat.id} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-28 truncate">{cat.name}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div className="bg-indigo-400 h-1.5 rounded-full transition-all duration-1000"
                        style={{ width: `${p}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-10 text-right">
                      {cat.average?.toFixed(1) ?? '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <button onClick={next} disabled={!scoreVisible}
          className="bg-indigo-700 hover:bg-indigo-800 active:scale-95 disabled:opacity-40 text-white text-lg font-semibold px-8 py-3 rounded-xl shadow transition-all">
          {remaining > 0 ? `Nächster Kandidat →` : '🏆 Sieger enthüllen!'}
        </button>
      </div>
    )
  }

  // ---- WINNER ----
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 space-y-8 text-center">
      <div className={`text-7xl transition-all duration-700 ${confettiVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
        🎉🏆🎉
      </div>

      {winner && (
        <>
          <div className={`transition-all duration-700 ${winnerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-3xl px-12 py-10 shadow-2xl space-y-3">
              <div className="text-sm uppercase tracking-widest text-amber-100">Platz 1 — Gewinner</div>
              <div className="text-5xl font-black">{winner.name}</div>
              {winner.description && <div className="text-amber-100 text-sm">{winner.description}</div>}
              <div className="text-8xl font-black mt-4">{winner.results.total_average?.toFixed(2) ?? '—'}</div>
              <div className="text-amber-200">von max. {winner.results.max_per_entry} Punkten</div>
              <div className="text-amber-200 text-sm">
                {juryCount > 0 && winner.results.submission_count < juryCount
                  ? `${winner.results.submission_count} von ${juryCount} Jury-Wertungen`
                  : `${winner.results.submission_count} Jury-Wertungen`}
              </div>
            </div>
          </div>

          {/* Full ranking */}
          <div className={`w-full max-w-lg space-y-2 transition-all duration-700 delay-500 ${confettiVisible ? 'opacity-100' : 'opacity-0'}`}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Gesamtranking</h3>
            {allCandidates.map(cand => (
              <div key={cand.id}
                className={`rounded-xl shadow px-4 py-3 flex items-center gap-4 ${
                  cand.rank === 1 ? 'bg-amber-50 border border-amber-200' : 'bg-white'
                }`}>
                <div className={`text-2xl font-black w-10 text-center ${
                  cand.rank === 1 ? 'text-amber-500' : 'text-gray-300'
                }`}>#{cand.rank}</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{cand.name}</div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                    <div className={`h-1.5 rounded-full transition-all duration-1000 ${
                      cand.rank === 1 ? 'bg-amber-400' : 'bg-indigo-400'
                    }`} style={{ width: `${Math.min(100, ((cand.results.total_average ?? 0) / (cand.results.max_per_entry ?? 1)) * 100)}%` }} />
                  </div>
                </div>
                <div className={`text-xl font-bold w-16 text-right ${cand.rank === 1 ? 'text-amber-600' : 'text-indigo-700'}`}>
                  {cand.results.total_average?.toFixed(2) ?? '—'}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <button onClick={restart}
        className="text-sm text-gray-400 hover:text-indigo-600 hover:underline transition-colors">
        ↺ Nochmal abspielen
      </button>
    </div>
  )
}
