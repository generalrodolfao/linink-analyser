import re
import json
import anthropic
from config import settings

_PAGE_MARKER = re.compile(r'\s*Page \d+ of \d+\s*', re.IGNORECASE)
_HTML_ENTITY = re.compile(r'&amp;|&lt;|&gt;|&quot;')
_ENTITY_MAP = {'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"'}

SCORE_CRITERIA = [
    "headline", "summary", "experience", "skills",
    "education", "recommendations", "connections",
    "activity", "completeness", "keywords",
]

_client: anthropic.AsyncAnthropic | None = None


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


def preprocess_linkedin_pdf(raw_text: str, max_chars: int = 4500) -> str:
    text = _PAGE_MARKER.sub('\n', raw_text)
    text = _HTML_ENTITY.sub(lambda m: _ENTITY_MAP[m.group()], text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = text.strip()
    if len(text) > max_chars:
        text = text[:max_chars] + '\n[... histórico anterior omitido ...]'
    return text


# ── Tool schemas ─────────────────────────────────────────────────────────────

_YEAR_OBJ = {
    "type": "object",
    "properties": {"year": {"type": "integer"}},
    "required": ["year"],
}

_SCORE_ITEM_SCHEMA = {
    "type": "object",
    "properties": {
        "category": {"type": "string", "enum": SCORE_CRITERIA},
        "score":     {"type": "integer", "minimum": 0, "maximum": 10},
        "max_score": {"type": "integer", "enum": [10]},
        "suggestions": {
            "type": "array",
            "items": {"type": "string"},
            "minItems": 1,
            "maxItems": 3,
        },
    },
    "required": ["category", "score", "max_score", "suggestions"],
}

_PARSE_AND_SCORE_TOOL = {
    "name": "submit_analysis",
    "description": "Submits the parsed LinkedIn profile and its scoring.",
    "input_schema": {
        "type": "object",
        "properties": {
            "profile": {
                "type": "object",
                "properties": {
                    "full_name":            {"type": ["string", "null"]},
                    "headline":             {"type": ["string", "null"]},
                    "summary":              {"type": ["string", "null"]},
                    "location":             {"type": ["string", "null"]},
                    "profile_url":          {"type": ["string", "null"]},
                    "experiences": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "title":       {"type": ["string", "null"]},
                                "company":     {"type": ["string", "null"]},
                                "description": {"type": ["string", "null"]},
                                "starts_at":   {"anyOf": [_YEAR_OBJ, {"type": "null"}]},
                                "ends_at":     {"anyOf": [_YEAR_OBJ, {"type": "null"}]},
                            },
                        },
                    },
                    "skills":               {"type": "array", "items": {"type": "string"}},
                    "education": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "school":      {"type": ["string", "null"]},
                                "degree_name": {"type": ["string", "null"]},
                                "starts_at":   {"anyOf": [_YEAR_OBJ, {"type": "null"}]},
                                "ends_at":     {"anyOf": [_YEAR_OBJ, {"type": "null"}]},
                            },
                        },
                    },
                    "connections":          {"type": ["integer", "null"]},
                    "recommendations_count": {"type": "integer"},
                    "certifications":       {"type": "array", "items": {"type": "string"}},
                    "languages":            {"type": "array", "items": {"type": "string"}},
                },
                "required": ["full_name", "headline", "experiences", "skills"],
            },
            "overall_score": {"type": "integer", "minimum": 0, "maximum": 100},
            "score_breakdown": {
                "type": "array",
                "items": _SCORE_ITEM_SCHEMA,
                "minItems": 10,
                "maxItems": 10,
            },
        },
        "required": ["profile", "overall_score", "score_breakdown"],
    },
}

_SCORE_ONLY_TOOL = {
    "name": "submit_scoring",
    "description": "Submits the LinkedIn profile scoring.",
    "input_schema": {
        "type": "object",
        "properties": {
            "overall_score": {"type": "integer", "minimum": 0, "maximum": 100},
            "score_breakdown": {
                "type": "array",
                "items": _SCORE_ITEM_SCHEMA,
                "minItems": 10,
                "maxItems": 10,
            },
        },
        "required": ["overall_score", "score_breakdown"],
    },
}

_HEADLINES_TOOL = {
    "name": "submit_headlines",
    "description": "Submits 3 LinkedIn headline variations.",
    "input_schema": {
        "type": "object",
        "properties": {
            "headlines": {
                "type": "array",
                "items": {"type": "string", "maxLength": 220},
                "minItems": 3,
                "maxItems": 3,
            },
        },
        "required": ["headlines"],
    },
}

_BIOS_TOOL = {
    "name": "submit_bios",
    "description": "Submits 3 LinkedIn bio/summary variations.",
    "input_schema": {
        "type": "object",
        "properties": {
            "bios": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 3,
                "maxItems": 3,
            },
        },
        "required": ["bios"],
    },
}

_PITCHES_TOOL = {
    "name": "submit_pitches",
    "description": "Submits 3 LinkedIn connection message variations.",
    "input_schema": {
        "type": "object",
        "properties": {
            "pitches": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 3,
                "maxItems": 3,
            },
        },
        "required": ["pitches"],
    },
}


# ── Core helpers ─────────────────────────────────────────────────────────────

async def _call_tool(system: str, user: str, tool: dict, max_tokens: int = 4096) -> dict:
    """Force a tool call; returns the tool input dict (always valid JSON)."""
    message = await _get_client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
        tools=[tool],
        tool_choice={"type": "tool", "name": tool["name"]},
    )
    for block in message.content:
        if block.type == "tool_use" and block.name == tool["name"]:
            return block.input
    raise ValueError(f"Tool '{tool['name']}' not invoked by model")


async def _call_text(prompt: str, max_tokens: int = 2048) -> str:
    """Plain text call — used only for SVG and email (free-form output)."""
    message = await _get_client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


# ── Public API ────────────────────────────────────────────────────────────────

async def parse_and_score(raw_text: str) -> tuple[dict, dict]:
    text = preprocess_linkedin_pdf(raw_text)
    result = await _call_tool(
        system="Você é especialista em recrutamento e LinkedIn. Analise perfis com rigor e objetividade.",
        user=(
            f"A partir do texto bruto deste PDF de perfil LinkedIn, extraia os dados estruturados "
            f"e avalie em 10 critérios.\n\n"
            f"Texto do perfil:\n{text}\n\n"
            f"Avalie exatamente estes 10 critérios (cada um vale até 10 pontos): {', '.join(SCORE_CRITERIA)}\n"
            f"O campo 'category' deve usar exatamente os nomes acima (em inglês).\n"
            f"As sugestões devem estar em português, ser acionáveis e específicas.\n"
            f"O overall_score deve ser a média ponderada. Seja rigoroso mas construtivo."
        ),
        tool=_PARSE_AND_SCORE_TOOL,
        max_tokens=4096,
    )
    profile = result["profile"]
    scoring = {
        "overall_score": result["overall_score"],
        "score_breakdown": result["score_breakdown"],
    }
    return profile, scoring


async def score_profile(profile_data: dict) -> dict:
    return await _call_tool(
        system="Você é especialista em recrutamento e LinkedIn com 10 anos de experiência.",
        user=(
            f"Analise este perfil e retorne uma pontuação detalhada.\n\n"
            f"Perfil:\n{json.dumps(profile_data, ensure_ascii=False, indent=2)}\n\n"
            f"Avalie exatamente estes 10 critérios (cada um vale até 10 pontos): {', '.join(SCORE_CRITERIA)}\n"
            f"O campo 'category' deve usar exatamente os nomes acima (em inglês).\n"
            f"As sugestões devem estar em português. Penalize campos ausentes/nulos proporcionalmente."
        ),
        tool=_SCORE_ONLY_TOOL,
    )


async def generate_headlines(profile_data: dict) -> list[str]:
    result = await _call_tool(
        system="Você é especialista em personal branding para LinkedIn.",
        user=(
            f"Gere 3 variações de headline profissional para este perfil.\n\n"
            f"Perfil:\n{json.dumps(profile_data, ensure_ascii=False, indent=2)}\n\n"
            f"Regras:\n"
            f"- Máximo 220 caracteres cada\n"
            f"- Inclua palavras-chave do nicho e cargo\n"
            f"- Misture especialidade, proposta de valor e diferencial\n"
            f"- Tom profissional, direto e memorável\n"
            f"- Varie o estilo entre as 3 opções"
        ),
        tool=_HEADLINES_TOOL,
    )
    return result["headlines"]


async def generate_bio(profile_data: dict) -> list[str]:
    result = await _call_tool(
        system="Você é especialista em copywriting para LinkedIn.",
        user=(
            f"Gere 3 variações de bio/resumo profissional para este perfil.\n\n"
            f"Perfil:\n{json.dumps(profile_data, ensure_ascii=False, indent=2)}\n\n"
            f"Regras para cada variação:\n"
            f"- Entre 200 e 400 palavras\n"
            f"- Começa com um gancho forte (pergunta, dado ou afirmação impactante)\n"
            f"- Inclui 2-3 conquistas com números quando possível\n"
            f"- Termina com CTA claro (contato, colaboração, etc.)\n"
            f"- Linguagem em primeira pessoa, humana e autêntica\n"
            f"- Varie o tom: formal, conversacional e aspiracional"
        ),
        tool=_BIOS_TOOL,
        max_tokens=4096,
    )
    return result["bios"]


async def generate_banner_svg(profile_data: dict) -> str:
    name = profile_data.get("full_name") or "Profissional"
    headline = (profile_data.get("headline") or "")[:100]
    svg = await _call_text(
        f"Gere um banner profissional para LinkedIn em formato SVG.\n\n"
        f"Dimensões: 1584 x 396 pixels (viewBox=\"0 0 1584 396\")\n"
        f"Nome: {name}\n"
        f"Cargo/Headline: {headline}\n\n"
        f"Requisitos:\n"
        f"- Fundo com gradiente moderno (azul escuro ou roxo profissional)\n"
        f"- Nome em destaque (fonte grande, branca)\n"
        f"- Cargo/headline abaixo do nome (fonte menor, cor clara)\n"
        f"- Elementos geométricos sutis decorativos\n"
        f"- Visual limpo, corporativo e elegante\n"
        f"- Sem imagens externas, apenas shapes SVG e texto\n\n"
        f"Retorne APENAS o código SVG completo, começando com <svg e terminando com </svg>.",
        max_tokens=2048,
    )
    match = re.search(r'<svg[\s\S]*</svg>', svg)
    return match.group() if match else svg


async def generate_pitch(profile_data: dict, signal: str) -> list[str]:
    result = await _call_tool(
        system="Você é especialista em outreach B2B personalizado.",
        user=(
            f"Gere 3 variações de mensagem de conexão no LinkedIn.\n\n"
            f"Remetente:\n{json.dumps(profile_data, ensure_ascii=False, indent=2)}\n\n"
            f"Sinal de contexto:\n{signal}\n\n"
            f"Regras rígidas:\n"
            f"- Exatamente 3 sentenças cada\n"
            f"- 1ª sentença: menciona o sinal específico de forma natural\n"
            f"- 2ª sentença: mostra valor ou conexão relevante\n"
            f"- 3ª sentença: CTA suave (pergunta aberta ou proposta de conversa)\n"
            f"- Máximo 300 caracteres totais\n"
            f"- Tom consultivo, nunca vendedor agressivo"
        ),
        tool=_PITCHES_TOOL,
    )
    return result["pitches"]


async def generate_application_email(profile_data: dict, job_description: str) -> str:
    return await _call_text(
        f"Você é especialista em candidaturas de emprego. Gere um e-mail de candidatura personalizado.\n\n"
        f"Candidato:\n{json.dumps(profile_data, ensure_ascii=False, indent=2)}\n\n"
        f"Vaga:\n{job_description[:3000]}\n\n"
        f"Estrutura:\n"
        f"1. Abertura: mencione a vaga e demonstre conhecimento da empresa\n"
        f"2. Fit: cruze 2-3 habilidades/experiências com requisitos da vaga\n"
        f"3. Diferencial: destaque uma conquista mensurável relevante\n"
        f"4. CTA: convite para entrevista com disponibilidade\n\n"
        f"Máximo 350 palavras. Tom: profissional e entusiasmado.\n"
        f"Retorne APENAS o corpo do e-mail, sem linha de assunto.",
        max_tokens=1024,
    )
