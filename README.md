# LinkedIn Pro-Copilot

Micro SaaS com dois pilares: **Personal Branding** e **Prospecção de Intenção**.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16 + Tailwind v4 + Shadcn/UI |
| Backend | FastAPI (Python 3.12+) |
| Banco/Auth | Supabase (PostgreSQL) |
| IA (texto) | Anthropic Claude 3.5 Sonnet / OpenAI GPT-4o |
| IA (imagens) | Replicate API (Stable Diffusion 3) |
| Dados LinkedIn | Proxycurl API |

## Quickstart

### Backend (FastAPI)

```bash
cd api
cp .env.example .env
# Edite .env com suas chaves de API

python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
# API disponível em http://localhost:8000
# Docs em http://localhost:8000/docs
```

### Frontend (Next.js)

```bash
cd frontend
cp .env.local.example .env.local
# Edite .env.local com suas credenciais Supabase

npm install
npm run dev
# App disponível em http://localhost:3000
```

### Banco de dados (Supabase)

Execute o arquivo `supabase/schema.sql` no SQL Editor do seu projeto Supabase.

## Funcionalidades

| Funcionalidade | Status |
|---------------|--------|
| Auditoria de Perfil (Score 0-100) | ✅ |
| Gerador de Headlines (3 variações) | ✅ |
| Gerador de Bio (3 variações) | ✅ |
| Banner AI (1584×396 px) | ✅ |
| Signal-Based Pitch | ✅ |
| E-mail de Candidatura | ✅ |
| Autenticação (Supabase Auth) | 🔜 |
| Limite diário de gerações | 🔜 |
| Histórico de gerações | 🔜 |

## Modo desenvolvimento sem chaves de API

O sistema funciona sem nenhuma chave configurada usando mocks:
- **Sem `PROXYCURL_API_KEY`**: usa perfil de exemplo (João Silva)
- **Sem `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`**: retorna respostas mock realistas
- **Sem `REPLICATE_API_TOKEN`**: retorna imagem placeholder
- **Sem `SUPABASE_*`**: usa armazenamento em memória (dados perdidos ao reiniciar)

## Regras de segurança

- Nunca realiza ações diretas no LinkedIn (sem automação)
- Não armazena cookies de sessão do usuário
- Limite de 30 gerações/usuário/dia (configurável)
- Todos os outputs de IA requerem revisão humana antes do uso
