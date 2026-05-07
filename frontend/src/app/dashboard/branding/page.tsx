'use client'

import { useState } from 'react'
import { generateHeadlines, generateBio, generateBanner } from '@/lib/api'

type Tab = 'headlines' | 'bio' | 'banner'

export default function BrandingPage() {
  const [profileId, setProfileId] = useState('')
  const [tab, setTab] = useState<Tab>('headlines')
  const [headlines, setHeadlines] = useState<string[]>([])
  const [bios, setBios] = useState<string[]>([])
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    if (!profileId.trim()) { setError('Insira um Profile ID'); return }
    setLoading(true)
    setError(null)
    try {
      if (tab === 'headlines') {
        const data = await generateHeadlines(profileId) as { headlines: string[] }
        setHeadlines(data.headlines)
      } else if (tab === 'bio') {
        const data = await generateBio(profileId) as { bios: string[] }
        setBios(data.bios)
      } else {
        const data = await generateBanner(profileId) as { image_url: string }
        setBannerUrl(data.image_url)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar')
    } finally {
      setLoading(false)
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'headlines', label: 'Headlines' },
    { id: 'bio', label: 'Bio' },
    { id: 'banner', label: 'Banner' },
  ]

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Branding</h1>
        <p className="text-sm text-muted-foreground">Gere headlines, bio e banner com IA a partir do seu perfil.</p>
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
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3 py-2 text-sm transition-colors border-b-2 -mb-px ${
                tab === id
                  ? 'border-primary text-foreground font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

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

      {tab === 'headlines' && headlines.length > 0 && (
        <div className="max-w-2xl space-y-3">
          {headlines.map((h, i) => (
            <div key={i} className="group flex items-start justify-between gap-4 p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-foreground leading-relaxed">{h}</p>
              <button
                onClick={() => navigator.clipboard.writeText(h)}
                className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Copiar
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'bio' && bios.length > 0 && (
        <div className="max-w-2xl space-y-4">
          {bios.map((b, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Variação {i + 1}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(b)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Copiar
                </button>
              </div>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{b}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'banner' && (
        <div className="max-w-2xl space-y-3">
          {bannerUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bannerUrl}
                alt="Banner LinkedIn"
                className="w-full rounded-lg border border-border"
                style={{ aspectRatio: '1584/396', objectFit: 'cover' }}
              />
              <a
                href={bannerUrl}
                download="banner-linkedin.png"
                className="flex items-center justify-center w-full py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
              >
                Baixar Banner
              </a>
            </>
          ) : (
            <div
              className="rounded-lg border border-dashed border-border bg-muted/30 flex items-center justify-center text-muted-foreground"
              style={{ aspectRatio: '1584/396' }}
            >
              <p className="text-xs">1584 × 396 px</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
