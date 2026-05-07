'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { generateHeadlines, generateBio, generateBanner } from '@/lib/api'

type Loading = Record<string, boolean>

export default function BrandingPage() {
  const [profileId, setProfileId] = useState('')
  const [headlines, setHeadlines] = useState<string[]>([])
  const [bios, setBios] = useState<string[]>([])
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState<Loading>({})
  const [error, setError] = useState<string | null>(null)

  function setLoad(key: string, val: boolean) {
    setLoading((prev) => ({ ...prev, [key]: val }))
  }

  async function handle(type: 'headlines' | 'bio' | 'banner') {
    if (!profileId.trim()) { setError('Insira um Profile ID'); return }
    setLoad(type, true)
    setError(null)
    try {
      if (type === 'headlines') {
        const data = await generateHeadlines(profileId) as { headlines: string[] }
        setHeadlines(data.headlines)
      } else if (type === 'bio') {
        const data = await generateBio(profileId) as { bios: string[] }
        setBios(data.bios)
      } else {
        const data = await generateBanner(profileId) as { image_url: string }
        setBannerUrl(data.image_url)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar conteúdo')
    } finally {
      setLoad(type, false)
    }
  }

  function copy(text: string) { navigator.clipboard.writeText(text) }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Branding</h1>
        <p className="text-muted-foreground text-sm mt-1">Headlines, bio e banner gerados com IA</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Profile ID</Label>
            <Input
              placeholder="UUID do perfil analisado"
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>}
        </CardContent>
      </Card>

      <Tabs defaultValue="headlines">
        <TabsList>
          <TabsTrigger value="headlines">Headlines</TabsTrigger>
          <TabsTrigger value="bio">Bio</TabsTrigger>
          <TabsTrigger value="banner">Banner</TabsTrigger>
        </TabsList>

        <TabsContent value="headlines" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>3 Variações de Headline</span>
                <Button size="sm" onClick={() => handle('headlines')} disabled={loading.headlines}>
                  {loading.headlines ? 'Gerando...' : 'Gerar'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {headlines.length > 0 ? (
                <div className="space-y-3">
                  {headlines.map((h, i) => (
                    <div key={i} className="p-4 bg-muted rounded-lg border border-border flex justify-between items-start gap-4">
                      <p className="text-foreground text-sm">{h}</p>
                      <Button size="sm" variant="outline" onClick={() => copy(h)}>Copiar</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Clique em &quot;Gerar&quot; para criar variações otimizadas.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bio" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>3 Variações de Bio</span>
                <Button size="sm" onClick={() => handle('bio')} disabled={loading.bio}>
                  {loading.bio ? 'Gerando...' : 'Gerar'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bios.length > 0 ? (
                <div className="space-y-4">
                  {bios.map((b, i) => (
                    <div key={i} className="p-4 bg-muted rounded-lg border border-border space-y-2">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline">Variação {i + 1}</Badge>
                        <Button size="sm" variant="outline" onClick={() => copy(b)}>Copiar</Button>
                      </div>
                      <p className="text-foreground text-sm whitespace-pre-wrap">{b}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Clique em &quot;Gerar&quot; para criar seu resumo profissional.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banner" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Banner LinkedIn (1584 × 396 px)</span>
                <Button size="sm" onClick={() => handle('banner')} disabled={loading.banner}>
                  {loading.banner ? 'Gerando...' : 'Gerar'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    className="flex h-9 w-full items-center justify-center rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    Baixar Banner
                  </a>
                </>
              ) : (
                <div
                  className="bg-muted rounded-lg flex items-center justify-center text-muted-foreground border border-border"
                  style={{ aspectRatio: '1584/396' }}
                >
                  <p className="text-sm">Seu banner aparecerá aqui</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
