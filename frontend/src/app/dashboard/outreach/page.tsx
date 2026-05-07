'use client'

import { useState } from 'react'
import { generatePitch, generateApplicationEmail } from '@/lib/api'

type Tab = 'pitch' | 'email'

export default function OutreachPage() {
  const [profileId, setProfileId] = useState('')
  const [tab, setTab] = useState<Tab>('pitch')
  const [signal, setSignal] = useState('')
  const [pitches, setPitches] = useState<string[]>([])
  const [jobDescription, setJobDescription] = useState('')
  const [emailResult, setEmailResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    if (!profileId.trim()) { setError('Insira um Profile ID'); return }
    if (tab === 'pitch' && !signal.trim()) { setError('Insira um sinal de contexto'); return }
    if (tab === 'email' && !jobDescription.trim()) { setError('Insira a descrição da vaga'); return }

    setLoading(true)
    setError(null)
    try {
      if (tab === 'pitch') {
        const data = await generatePitch(profileId, signal) as { pitches: string[] }
        setPitches(data.pitches)
      } else {
        const data = await generateApplicationEmail(profileId, jobDescription) as { email: string }
        setEmailResult(data.email)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Outreach</h1>
        <p className="text-sm text-muted-foreground">Pitches e e-mails personalizados baseados em sinal de contexto.</p>
      </div>

      <div className="max-w-lg space-y-6">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Profile ID</label>
          <input
            type="text"
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
            placeholder="UUID do perfil analisado"
            className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex gap-0.5 border-b border-border">
          {(['pitch', 'email'] as Tab[]).map((id) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3 py-2 text-sm transition-colors border-b-2 -mb-px ${
                tab === id
                  ? 'border-primary text-foreground font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {id === 'pitch' ? 'Signal Pitch' : 'E-mail'}
            </button>
          ))}
        </div>

        {tab === 'pitch' ? (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Sinal de contexto</label>
            <input
              type="text"
              value={signal}
              onChange={(e) => setSignal(e.target.value)}
              placeholder="Ex: vi seu post sobre automação com IA..."
              className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">Post, mudança de cargo, conquista publicada.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Descrição da vaga</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Cole a descrição completa da vaga..."
              rows={6}
              className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">{error}</p>
        )}

        <button
          onClick={generate}
          disabled={loading}
          className="bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {loading ? 'Gerando...' : 'Gerar'}
        </button>
      </div>

      {tab === 'pitch' && pitches.length > 0 && (
        <div className="max-w-2xl space-y-3">
          {pitches.map((p, i) => (
            <div key={i} className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border bg-card">
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground font-medium">Variação {i + 1}</span>
                <p className="text-sm text-foreground leading-relaxed">{p}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(p)}
                className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Copiar
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'email' && emailResult && (
        <div className="max-w-2xl rounded-lg border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">E-mail gerado</span>
            <button
              onClick={() => navigator.clipboard.writeText(emailResult)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Copiar
            </button>
          </div>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{emailResult}</p>
        </div>
      )}
    </div>
  )
}
