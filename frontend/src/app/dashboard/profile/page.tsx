'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { ProfileAnalysis, ScoreBreakdown } from '@/types'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function scoreColor(pct: number) {
  if (pct >= 80) return 'text-green-600'
  if (pct >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

type Step = 'form' | 'waiting_payment' | 'analyzing' | 'done' | 'error'

export default function ProfilePage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [step, setStep] = useState<Step>('form')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Resume session from URL params if returning from Cakto
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sid = params.get('session_id')
    const orderId = params.get('order_id')
    if (sid) {
      setSessionId(sid)
      setStep('waiting_payment')
      if (orderId) verifyOrder(sid, orderId)
      else startPolling(sid)
    }
  }, [])

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  function handleFileDrop(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Envie somente arquivos .pdf')
      return
    }
    setError(null)
    setPdfFile(file)
  }

  async function handlePay() {
    if (!pdfFile) return
    setError(null)

    const form = new FormData()
    form.append('pdf_file', pdfFile)

    try {
      const res = await fetch(`${API}/payment/checkout-pdf`, {
        method: 'POST',
        body: form,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Erro desconhecido' }))
        throw new Error(err.detail || 'Erro ao iniciar pagamento')
      }
      const { session_id, checkout_url } = await res.json()
      setSessionId(session_id)

      const returnUrl = `${window.location.origin}/dashboard/profile?session_id=${session_id}`
      const finalUrl = `${checkout_url}&redirect_url=${encodeURIComponent(returnUrl)}`

      setStep('waiting_payment')
      window.location.href = finalUrl
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao iniciar pagamento')
    }
  }

  async function verifyOrder(sid: string, orderId: string) {
    setStep('analyzing')
    try {
      const res = await fetch(`${API}/payment/verify/${orderId}`, { method: 'POST' })
      if (!res.ok) { startPolling(sid); return }
      const data = await res.json()
      if (data.status === 'completed' && data.profile_id) {
        await loadAnalysis(sid, data.profile_id, data.overall_score)
      } else {
        startPolling(sid)
      }
    } catch {
      startPolling(sid)
    }
  }

  function startPolling(sid: string) {
    if (pollRef.current) clearInterval(pollRef.current)
    setStep('waiting_payment')
    pollRef.current = setInterval(() => pollStatus(sid), 4000)
  }

  async function pollStatus(sid: string) {
    try {
      const res = await fetch(`${API}/payment/status/${sid}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.status === 'analyzing') {
        setStep('analyzing')
      } else if (data.status === 'completed' && data.profile_id) {
        clearInterval(pollRef.current!)
        await loadAnalysis(sid, data.profile_id, data.overall_score)
      } else if (data.status === 'failed') {
        clearInterval(pollRef.current!)
        setStep('error')
        setError('A análise falhou. Tente novamente ou entre em contato com o suporte.')
      }
    } catch { /* keep polling */ }
  }

  async function loadAnalysis(sid: string, profileId: string, overallScore: number) {
    setAnalysis({
      profile: {
        id: profileId,
        user_id: null,
        linkedin_url: '',
        full_name: null,
        headline: null,
        summary: null,
        experience_json: null,
        profile_score: overallScore,
        created_at: new Date().toISOString(),
      },
      score_breakdown: [],
      overall_score: overallScore,
    })
    setStep('done')
  }

  // -------- WAITING PAYMENT --------
  if (step === 'waiting_payment') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="text-5xl animate-pulse">💳</div>
        <h2 className="text-2xl font-bold text-slate-900">Aguardando pagamento</h2>
        <p className="text-slate-500 max-w-sm">
          Complete o pagamento na janela do Cakto. Assim que confirmado, sua análise começa automaticamente.
        </p>
        <div className="flex gap-3">
          {sessionId && (
            <Button variant="outline" onClick={() => startPolling(sessionId)}>
              Verificar pagamento
            </Button>
          )}
          <Button variant="ghost" onClick={() => { setStep('form'); clearInterval(pollRef.current!) }}>
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  // -------- ANALYZING --------
  if (step === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="text-5xl animate-spin">🤖</div>
        <h2 className="text-2xl font-bold text-slate-900">Analisando seu perfil com IA...</h2>
        <p className="text-slate-500 max-w-sm">Isso leva cerca de 20 segundos. Não feche esta página.</p>
        <Progress value={null} className="w-64" />
      </div>
    )
  }

  // -------- FORM --------
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Auditoria de Perfil</h1>
        <p className="text-slate-500 text-sm">
          Análise completa com IA · R$ {process.env.NEXT_PUBLIC_ANALYSIS_PRICE || '29,90'}
        </p>
      </div>

      {step === 'form' && (
        <Card>
          <CardHeader>
            <CardTitle>Envie o PDF do seu LinkedIn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* How to export PDF */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-600 space-y-1">
              <p className="font-medium text-slate-800">Como exportar o PDF do LinkedIn:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Abra seu perfil no LinkedIn</li>
                <li>Clique em <strong>Mais</strong> → <strong>Salvar como PDF</strong></li>
                <li>Faça o upload do arquivo abaixo</li>
              </ol>
            </div>

            {/* Drop zone */}
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

            {/* Benefits */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-1">
              <p className="text-sm font-medium text-blue-900">O que você recebe:</p>
              <ul className="text-sm text-blue-700 space-y-0.5">
                <li>✓ Score 0–100 com avaliação em 10 critérios</li>
                <li>✓ Sugestões de melhoria acionáveis por seção</li>
                <li>✓ Profile ID para gerar headlines, bio e banner</li>
              </ul>
            </div>

            <Button
              onClick={handlePay}
              disabled={!pdfFile}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Pagar e Analisar · R$ {process.env.NEXT_PUBLIC_ANALYSIS_PRICE || '29,90'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* DONE */}
      {step === 'done' && analysis && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-slate-500 text-sm mb-2">Score Geral</p>
              <p className={`text-6xl font-bold ${scoreColor(analysis.overall_score)}`}>
                {analysis.overall_score}
              </p>
              <p className="text-slate-400 text-sm mt-1">/ 100</p>
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
                          <p key={i} className="text-xs text-slate-500 flex gap-1.5">
                            <span className="text-amber-500 shrink-0">→</span>{s}
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
            <CardContent className="pt-4 text-sm text-slate-600 space-y-2">
              <p>
                Profile ID (use nas abas Branding e Outreach):{' '}
                <code
                  className="bg-slate-100 px-1.5 py-0.5 rounded cursor-pointer hover:bg-slate-200 text-xs"
                  onClick={() => navigator.clipboard.writeText(analysis.profile.id)}
                  title="Clique para copiar"
                >
                  {analysis.profile.id}
                </code>
              </p>
              <Button variant="outline" size="sm" onClick={() => { setStep('form'); setPdfFile(null) }}>
                Analisar outro perfil
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* ERROR */}
      {step === 'error' && (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-red-600">{error || 'Algo deu errado.'}</p>
            <Button onClick={() => { setStep('form'); setError(null) }}>Tentar novamente</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
