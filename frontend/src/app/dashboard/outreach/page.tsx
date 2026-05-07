'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { generatePitch, generateApplicationEmail } from '@/lib/api'

export default function OutreachPage() {
  const [profileId, setProfileId] = useState('')
  const [signal, setSignal] = useState('')
  const [pitches, setPitches] = useState<string[]>([])
  const [jobDescription, setJobDescription] = useState('')
  const [applicationEmail, setApplicationEmail] = useState('')
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  function setLoad(key: string, val: boolean) {
    setLoading((prev) => ({ ...prev, [key]: val }))
  }

  function copy(text: string) { navigator.clipboard.writeText(text) }

  async function handlePitch() {
    if (!profileId.trim() || !signal.trim()) { setError('Preencha o Profile ID e o sinal'); return }
    setLoad('pitch', true); setError(null)
    try {
      const data = await generatePitch(profileId, signal) as { pitches: string[] }
      setPitches(data.pitches)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar pitch')
    } finally {
      setLoad('pitch', false)
    }
  }

  async function handleEmail() {
    if (!profileId.trim() || !jobDescription.trim()) { setError('Preencha o Profile ID e a descrição da vaga'); return }
    setLoad('email', true); setError(null)
    try {
      const data = await generateApplicationEmail(profileId, jobDescription) as { email: string }
      setApplicationEmail(data.email)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar e-mail')
    } finally {
      setLoad('email', false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inteligência de Outreach</h1>
        <p className="text-slate-500 text-sm">Gere pitches e e-mails de candidatura personalizados</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Profile ID</Label>
            <Input
              placeholder="UUID do perfil analisado (obtenha na Auditoria de Perfil)"
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
        </CardContent>
      </Card>

      <Tabs defaultValue="pitch">
        <TabsList>
          <TabsTrigger value="pitch">Signal-Based Pitch</TabsTrigger>
          <TabsTrigger value="email">E-mail de Candidatura</TabsTrigger>
        </TabsList>

        <TabsContent value="pitch" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pitch Baseado em Sinal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sinal de Contexto</Label>
                <Input
                  placeholder='Ex: "Vi seu post sobre automação de vendas com IA..."'
                  value={signal}
                  onChange={(e) => setSignal(e.target.value)}
                />
                <p className="text-xs text-slate-400">Descreva o contexto que justifica o contato (post, mudança de cargo, conquista, etc.)</p>
              </div>
              <Button onClick={handlePitch} disabled={loading.pitch}>
                {loading.pitch ? 'Gerando...' : 'Gerar Pitches'}
              </Button>
              {pitches.length > 0 && (
                <div className="space-y-3">
                  {pitches.map((p, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium">Variação {i + 1}</span>
                        <Button size="sm" variant="outline" onClick={() => copy(p)}>Copiar</Button>
                      </div>
                      <p className="text-slate-700 text-sm">{p}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>E-mail de Candidatura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Descrição da Vaga (Job Description)</Label>
                <Textarea
                  placeholder="Cole aqui a descrição completa da vaga..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={6}
                />
              </div>
              <Button onClick={handleEmail} disabled={loading.email}>
                {loading.email ? 'Gerando...' : 'Gerar E-mail'}
              </Button>
              {applicationEmail && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>E-mail Gerado</Label>
                    <Button size="sm" variant="outline" onClick={() => copy(applicationEmail)}>Copiar</Button>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-slate-700 text-sm whitespace-pre-wrap">{applicationEmail}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
