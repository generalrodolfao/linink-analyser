Com certeza. Para que o **Claude Code** (ou qualquer agente de codificação baseado em I.A.) funcione com máxima eficiência, o arquivo de especificação deve ser estruturado de forma lógica, clara e com definições técnicas precisas.

Salve o conteúdo abaixo como `spec.md` na raiz do seu projeto antes de iniciar o Claude Code.

---

# Software Design Document (SDD): LinkedIn Pro-Copilot MVP

## 1. Visão Geral
O **LinkedIn Pro-Copilot** é um Micro SaaS focado em dois pilares: **Personal Branding** (Otimização de Perfil) e **Prospecção de Intenção** (Outreach baseado em sinais).[1, 2] O objetivo é permitir que profissionais comerciais e candidatos a vagas aumentem sua visibilidade e taxa de resposta sem violar os termos de serviço do LinkedIn, utilizando uma abordagem de "Copiloto" (sugestão e revisão humana).[3, 4]

## 2. Personas do MVP
1.  **SDRs/Vendedores:** Precisam de abordagens personalizadas baseadas em posts ou mudanças de cargo do lead.[1, 5]
2.  **Job Seekers:** Buscam otimizar o perfil para algoritmos de recrutamento (ATS) e gerar e-mails de aplicação.

## 3. Especificações Técnicas (Stack)
*   **Frontend:** Next.js 15 (App Router), Tailwind CSS, Shadcn/UI.[6]
*   **Backend:** FastAPI (Python 3.12+) para orquestração de I.A.[7]
*   **Database/Auth:** Supabase (PostgreSQL).[6]
*   **Modelos de I.A.:**
    *   **Texto:** OpenAI `gpt-4o` ou Anthropic `claude-3.5-sonnet`.[8, 6]
    *   **Imagem (Banners):** Replicate API (Stable Diffusion 3) ou Sivi API.
*   **Data Scraping:** API de terceiros (Proxycurl ou LinkdAPI) para evitar banimentos de IP e gestão de cookies.[9, 10, 11]

## 4. Funcionalidades (Requisitos de Produto)

### 4.1 Auditoria de Perfil (Profile Scorer)
*   **Entrada:** URL do perfil LinkedIn.
*   **Processamento:** Extração de dados via API e envio do JSON para LLM.[12, 13]
*   **Saída:** Pontuação de 0-100 baseada em 10 critérios (Headline, Resumo, Experiência, Competências, etc.).[14, 7]
*   **Interface:** Gráfico circular de score e checklist interativa de melhorias.

### 4.2 Gerador de Branding (Copy & Design)
*   **Headline & Bio:** Sugerir 3 variações otimizadas para SEO com palavras-chave do nicho.
*   **Banner AI:** Gerador de imagens nas dimensões **1584 x 396 px**. O prompt deve ser construído automaticamente pela I.A. com base no cargo e tom de voz do usuário.

### 4.3 Inteligência de Abordagem (Outreach)
*   **Signal-Based Pitch:** Gerar mensagens de 3 sentenças baseadas em um "fato" (ex: "Vi seu post sobre X...").
*   **Email de Aplicação:** Gerar corpo de e-mail personalizado cruzando a descrição da vaga (Job Description) com o perfil do usuário.

## 5. Modelo de Dados (Schema)

```sql
-- Perfis analisados
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  linkedin_url TEXT NOT NULL,
  full_name TEXT,
  headline TEXT,
  summary TEXT,
  experience_json JSONB,
  profile_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Histórico de gerações de I.A.
CREATE TABLE ai_outputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id),
  category TEXT, -- 'headline', 'bio', 'banner', 'pitch'
  content TEXT,
  metadata JSONB, -- Armazena prompts usados ou URLs de imagens
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 6. Fluxo de Desenvolvimento (Instruções para Claude Code)

### Passo 1: Setup do Ambiente
> "Claude, configure um projeto Next.js 15 com Tailwind e Shadcn/UI. Crie a estrutura de pastas para uma API FastAPI em `/api`."

### Passo 2: Integração de Dados
> "Implemente um endpoint que receba uma URL do LinkedIn e use a API do Proxycurl para retornar os dados do perfil em formato JSON estruturado."

### Passo 3: Lógica do Scorer
> "Crie uma função que envie os dados do perfil para o GPT-4o. O prompt deve agir como um especialista em recrutamento do LinkedIn e retornar um JSON com score de 0 a 100 e sugestões de melhoria para cada seção."[12, 14]

### Passo 4: UI de Branding e Outreach
> "Desenvolva componentes de dashboard para exibir o score, as sugestões de headline/bio e uma área para gerar o banner e as mensagens de abordagem."

## 7. Regras de Segurança e Compliance
1.  **Sem Automação Direta:** O software nunca deve realizar ações (cliques/envios) dentro do domínio `linkedin.com`.
2.  **IPs Residencias:** Se houver scraping próprio no futuro, usar obrigatoriamente proxies residenciais.[15, 16]
3.  **Privacidade:** Não armazenar cookies de sessão dos usuários.[13]
4.  **Limites de Taxa:** Implementar limites de 20-40 gerações por dia por usuário para evitar custos abusivos de API e mimetizar uso humano.[15, 17]

---

### Como usar este arquivo com o Claude Code:
1.  Inicie o Claude Code no seu terminal.
2.  Diga: `"Read spec.md and start implementing the project foundation."`
3.  Ele seguirá a arquitetura e as regras de segurança definidas para construir o MVP de forma modular.