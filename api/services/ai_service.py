import json
import re
import anthropic
from config import settings

_client: anthropic.AsyncAnthropic | None = None


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client

SCORE_CRITERIA = [
    "headline", "summary", "experience", "skills",
    "education", "recommendations", "connections",
    "activity", "completeness", "keywords",
]


async def score_profile(profile_data: dict) -> dict:
    prompt = f"""Você é um especialista em recrutamento e LinkedIn com 10 anos de experiência. Analise este perfil e retorne uma pontuação detalhada.

Perfil:
{json.dumps(profile_data, ensure_ascii=False, indent=2)}

Retorne APENAS um JSON válido com esta estrutura exata:
{{
  "overall_score": <inteiro 0-100>,
  "score_breakdown": [
    {{
      "category": "<nome em português>",
      "score": <inteiro 0-10>,
      "max_score": 10,
      "suggestions": ["<sugestão acionável 1>", "<sugestão acionável 2>"]
    }}
  ]
}}

Avalie exatamente estes 10 critérios (cada um vale até 10 pontos):
{', '.join(SCORE_CRITERIA)}

O overall_score deve ser a média ponderada dos critérios. Se campos estiverem ausentes/nulos, penalize proporcionalmente. Seja rigoroso mas construtivo."""

    response_text = await _call_ai(prompt)
    return json.loads(_extract_json(response_text))


async def generate_headlines(profile_data: dict) -> list[str]:
    prompt = f"""Você é especialista em personal branding para LinkedIn. Gere 3 variações de headline profissional.

Perfil:
{json.dumps(profile_data, ensure_ascii=False, indent=2)}

Regras:
- Máximo 220 caracteres cada
- Inclua palavras-chave do nicho e cargo
- Misture especialidade, proposta de valor e diferencial
- Tom profissional, direto e memorável
- Varie o estilo entre as 3 opções

Retorne APENAS este JSON: {{"headlines": ["...", "...", "..."]}}"""

    response_text = await _call_ai(prompt)
    return json.loads(_extract_json(response_text))["headlines"]


async def generate_bio(profile_data: dict) -> list[str]:
    prompt = f"""Você é especialista em copywriting para LinkedIn. Gere 3 variações de bio/resumo profissional.

Perfil:
{json.dumps(profile_data, ensure_ascii=False, indent=2)}

Regras para cada variação:
- Entre 200 e 400 palavras
- Começa com um gancho forte (pergunta, dado ou afirmação impactante)
- Inclui 2-3 conquistas com números quando possível
- Termina com CTA claro (contato, colaboração, etc.)
- Linguagem em primeira pessoa, humana e autêntica
- Varie o tom: formal, conversacional e aspiracional

Retorne APENAS este JSON: {{"bios": ["...", "...", "..."]}}"""

    response_text = await _call_ai(prompt)
    return json.loads(_extract_json(response_text))["bios"]


async def generate_banner_svg(profile_data: dict) -> str:
    """Generate a professional LinkedIn banner as inline SVG using Claude."""
    name = profile_data.get("full_name") or "Profissional"
    headline = profile_data.get("headline") or ""

    prompt = f"""Gere um banner profissional para LinkedIn em formato SVG.

Dimensões: 1584 x 396 pixels (viewBox="0 0 1584 396")
Nome: {name}
Cargo/Headline: {headline[:100]}

Requisitos:
- Fundo com gradiente moderno (azul escuro ou roxo profissional)
- Nome em destaque (fonte grande, branca)
- Cargo/headline abaixo do nome (fonte menor, cor clara)
- Elementos geométricos sutis decorativos (círculos, linhas ou formas)
- Visual limpo, corporativo e elegante
- Sem imagens externas, apenas shapes SVG e texto

Retorne APENAS o código SVG completo, começando com <svg e terminando com </svg>. Nenhum texto antes ou depois."""

    svg = await _call_ai(prompt)
    # Extract SVG if there's any surrounding text
    match = re.search(r'<svg[\s\S]*</svg>', svg)
    return match.group() if match else svg


async def generate_pitch(profile_data: dict, signal: str) -> list[str]:
    prompt = f"""Você é especialista em outreach B2B personalizado. Gere 3 variações de mensagem de conexão no LinkedIn.

Remetente:
{json.dumps(profile_data, ensure_ascii=False, indent=2)}

Sinal de contexto:
{signal}

Regras rígidas:
- Exatamente 3 sentenças cada
- 1ª sentença: menciona o sinal específico de forma natural
- 2ª sentença: mostra valor ou conexão relevante
- 3ª sentença: CTA suave (pergunta aberta ou proposta de conversa)
- Máximo 300 caracteres totais
- Tom consultivo, nunca vendedor agressivo

Retorne APENAS este JSON: {{"pitches": ["...", "...", "..."]}}"""

    response_text = await _call_ai(prompt)
    return json.loads(_extract_json(response_text))["pitches"]


async def generate_application_email(profile_data: dict, job_description: str) -> str:
    prompt = f"""Você é especialista em candidaturas de emprego. Gere um e-mail de candidatura personalizado e persuasivo.

Candidato:
{json.dumps(profile_data, ensure_ascii=False, indent=2)}

Vaga:
{job_description[:3000]}

Estrutura do e-mail:
1. Abertura: mencione a vaga e demonstre conhecimento da empresa (1 parágrafo)
2. Fit: cruze 2-3 habilidades/experiências do candidato com requisitos da vaga (1-2 parágrafos)
3. Diferencial: destaque uma conquista mensurável relevante (1 parágrafo)
4. CTA: convite para entrevista com disponibilidade (1 parágrafo curto)

Máximo 350 palavras. Tom: profissional e entusiasmado, nunca desesperado.
Retorne APENAS o corpo do e-mail, sem linha de assunto."""

    return await _call_ai(prompt)


async def _call_ai(prompt: str) -> str:
    message = await _get_client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


def _extract_json(text: str) -> str:
    match = re.search(r'\{[\s\S]*\}', text)
    return match.group() if match else text
