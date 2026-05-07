'use client'

import { useState, useRef } from 'react'
import type { ScoreBreakdown } from '@/types'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Step = 'form' | 'analyzing' | 'done' | 'error'

interface Analysis {
  profile_id: string
  overall_score: number
  full_name: string | null
  headline: string | null
  score_breakdown: ScoreBreakdown[]
}

function ScoreBar({ value, max }: { value: number; max: number }) {
  const pct = Math.round((value / max) * 100)
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">{value}/{max}</span>
    </div>
  )
}

export default function ProfilePage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [step, setStep] = useState<Step>('form')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Apenas arquivos .pdf são aceitos')
      return
    }
    setError(null)
    setPdfFile(file)
  }

  async function handleAnalyze() {
    if (!pdfFile) return
    setError(null)
    setStep('analyzing')

    const form = new FormData()
    form.append('pdf_file', pdfFile)

    try {
      const res = await fetch(`${API}/profile/analyze-pdf`, { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Erro desconhecido' }))
        throw new Error(err.detail || 'Erro na análise')
      }
      const data = await res.json()
      setAnalysis({
        profile_id: data.profile.id,
        overall_score: data.overall_score,
        full_name: data.profile.full_name,
        headline: data.profile.headline,
        score_breakdown: data.score_breakdown,
      })
      setStep('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro na análise')
      setStep('error')
    }
  }

  function reset() {
    setStep('form')
    setPdfFile(null)
    setAnalysis(null)
    setError(null)
  }

  if (step === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Analisando perfil...</p>
      </div>
    )
  }

  if (step === 'done' && analysis) {
    const scoreColor = analysis.overall_score >= 80 ? 'text-emerald-400' : analysis.overall_score >= 60 ? 'text-amber-400' : 'text-red-400'
    return (
      <div className="space-y-10">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">
            {analysis.full_name ?? 'Análise de Perfil'}
          </h1>
          {analysis.headline && (
            <p className="text-sm text-muted-foreground">{analysis.headline}</p>
          )}
        </div>

        <div className="flex items-start gap-12">
          <div className="shrink-0 space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Score</p>
            <p className={`text-7xl font-bold tabular-nums leading-none ${scoreColor}`}>
              {analysis.overall_score}
            </p>
            <p className="text-xs text-muted-foreground">de 100</p>
          </div>

          {analysis.score_breakdown.length > 0 && (
            <div className="flex-1 space-y-4 pt-1">
              {analysis.score_breakdown.map((item) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground capitalize">{item.category}</span>
                  </div>
                  <ScoreBar value={item.score} max={item.max_score} />
                  {item.suggestions.length > 0 && (
                    <ul className="space-y-0.5">
                      {item.suggestions.map((s, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex gap-2">
                          <span className="shrink-0 text-border">—</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Profile ID</p>
            <button
              onClick={() => navigator.clipboard.writeText(analysis.profile_id)}
              className="text-xs font-mono text-foreground hover:text-primary transition-colors"
              title="Clique para copiar"
            >
              {analysis.profile_id}
            </button>
          </div>
          <button
            onClick={reset}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Analisar outro perfil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Auditoria de Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Exporte seu perfil do LinkedIn como PDF e faça o upload para análise.
        </p>
      </div>

      <div className="space-y-6 max-w-lg">
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            const file = e.dataTransfer.files[0]
            if (file) handleFile(file)
          }}
          className={`
            cursor-pointer rounded-lg border-2 border-dashed transition-colors p-12 flex flex-col items-center gap-3 text-center
            ${dragging ? 'border-primary bg-primary/5' : pdfFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border hover:border-border/80 hover:bg-muted/20'}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={pdfFile ? 'text-emerald-400' : 'text-muted-foreground'}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {pdfFile ? (
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">{pdfFile.name}</p>
              <p className="text-xs text-muted-foreground">{(pdfFile.size / 1024).toFixed(0)} KB · clique para trocar</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Arraste o PDF aqui</p>
              <p className="text-xs text-muted-foreground">ou clique para selecionar</p>
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="space-y-3">
          <button
            onClick={handleAnalyze}
            disabled={!pdfFile}
            className="w-full bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-md hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
          >
            Analisar Perfil
          </button>
          <p className="text-xs text-muted-foreground text-center">
            No LinkedIn: <strong className="text-foreground">Mais</strong> → <strong className="text-foreground">Salvar como PDF</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
