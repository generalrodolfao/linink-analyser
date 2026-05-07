'use client'

import { useState, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { ScoreBreakdown } from '@/types'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function scoreColor(pct: number) {
  if (pct >= 80) return 'text-green-400'
  if (pct >= 60) return 'text-yellow-400'
  return 'text-red-400'
}

type Step = 'form' | 'analyzing' | 'done' | 'error'

interface Analysis {
  profile_id: string
  overall_score: number
  full_name: string | null
  headline: string | null
  score_breakdown: ScoreBreakdown[]
}

export default function ProfilePage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [step, setStep] = useState<Step>('form')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileDrop(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Envie somente arquivos .pdf')
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
      const res = await fetch(`${API}/profile/analyze-pdf`, {
        method: 'POST',
        body: form,
      })
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

  // -------- ANALYZING --------
  if (step === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="text-5xl animate-spin">🤖</div>
        <h2 className="text-2xl font-bold text-foreground">Analisando seu perfil com IA...</h2>
        <p className="text-muted-foreground max-w-sm">Isso leva cerca de 20–30 segundos. Não feche esta página.</p>
        <Progress value={null} className="w-64" />
      </div>
    )
  }

  // -------- DONE --------
  if (step === 'done' && analysis) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {analysis.full_name ? `Análise de ${analysis.full_name}` : 'Análise de Perfil'}
          </h1>
          {analysis.headline && <p className="text-muted-foreground text-sm mt-1">{analysis.headline}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-muted-foreground text-sm mb-2">Score Geral</p>
            <p className={`text-6xl font-bold ${scoreColor(analysis.overall_score)}`}>
              {analysis.overall_score}
            </p>
            <p className="text-muted-foreground text-sm mt-1">/ 100</p>
            <div className="w-full mt-4">
              <Progress value={analysis.overall_score} />
            </div>
          </Card>

          {analysis.score_breakdown.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader><CardTitle>Detalhes por Seção</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {analysis.score_breakdown.map((item: ScoreBreakdown) => {
                  const pct = Math.round((item.score / item.max_score) * 100)
                  return (
                    <div key={item.category} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium capitalize">{item.category}</span>
                        <span className={scoreColor(pct)}>{item.score}/{item.max_score}</span>
                      </div>
                      <Progress value={pct} />
                      {item.suggestions.map((s, i) => (
                        <p key={i} className="text-xs text-muted-foreground flex gap-1.5">
                          <span className="text-amber-400 shrink-0">→</span>{s}
                        </p>
                      ))}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardContent className="pt-4 text-sm text-muted-foreground space-y-2">
            <p>
              Profile ID (use nas abas Branding e Outreach):{' '}
              <code
                className="bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-muted/80 text-xs font-mono"
                onClick={() => navigator.clipboard.writeText(analysis.profile_id)}
                title="Clique para copiar"
              >
                {analysis.profile_id}
              </code>
            </p>
            <Button variant="outline" size="sm" onClick={() => { setStep('form'); setPdfFile(null); setAnalysis(null) }}>
              Analisar outro perfil
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // -------- FORM --------
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Auditoria de Perfil</h1>
        <p className="text-muted-foreground text-sm">Análise completa com IA em 10 critérios</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Envie o PDF do seu LinkedIn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="bg-muted border border-border rounded-lg p-4 text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Como exportar o PDF do LinkedIn:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Abra seu perfil no LinkedIn</li>
              <li>Clique em <strong>Mais</strong> → <strong>Salvar como PDF</strong></li>
              <li>Faça o upload do arquivo abaixo</li>
            </ol>
          </div>

          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              const file = e.dataTransfer.files[0]
              if (file) handleFileDrop(file)
            }}
            className={`
              relative cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors
              ${dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}
              ${pdfFile ? 'border-green-400 bg-green-50' : ''}
            `}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileDrop(f) }}
            />
            {pdfFile ? (
              <div className="space-y-1">
                <div className="text-3xl">✅</div>
                <p className="font-medium text-green-700">{pdfFile.name}</p>
                <p className="text-xs text-slate-400">{(pdfFile.size / 1024).toFixed(0)} KB · clique para trocar</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-4xl">📄</div>
                <p className="font-medium text-slate-700">Arraste o PDF aqui ou clique para selecionar</p>
                <p className="text-xs text-slate-400">Somente arquivos .pdf do LinkedIn</p>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-1">
            <p className="text-sm font-medium text-foreground">O que você recebe:</p>
            <ul className="text-sm text-muted-foreground space-y-0.5">
              <li>✓ Score 0–100 com avaliação em 10 critérios</li>
              <li>✓ Sugestões de melhoria acionáveis por seção</li>
              <li>✓ Profile ID para gerar headlines, bio e banner</li>
            </ul>
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={!pdfFile}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            Analisar Perfil
          </Button>
        </CardContent>
      </Card>

      {step === 'error' && (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-red-600">{error}</p>
            <Button onClick={() => { setStep('form'); setError(null) }}>Tentar novamente</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
