import json

import google.generativeai as genai

from app.core.config import settings

SYSTEM_PROMPT = """You are an assistant that drafts short, professional collaboration \
proposals between two complementary local businesses (e.g. a wedding photographer and \
a decorator). Respond ONLY with valid JSON, no markdown fences, matching this schema:

{
  "title": "string, e.g. 'Photography x Decor Partnership Proposal'",
  "summary": "string, 2-3 sentences",
  "terms": {
    "referral_structure": "string",
    "suggested_bundle": "string",
    "next_steps": ["string", "string"]
  }
}
"""


def generate_collaboration_proposal(business_a: dict, business_b: dict, context: str | None) -> dict:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        system_instruction=SYSTEM_PROMPT,
    )

    user_prompt = f"""
Business A: {business_a['name']} ({business_a['category']}) — {business_a.get('description', '')}
Business B: {business_b['name']} ({business_b['category']}) — {business_b.get('description', '')}
Extra context from user: {context or 'None'}

Draft a partnership proposal between these two businesses.
"""

    response = model.generate_content(
        user_prompt,
        generation_config=genai.GenerationConfig(
            max_output_tokens=800,
            response_mime_type="application/json",
        ),
    )

    return json.loads(response.text)


def build_fallback_proposal(business_a: dict, business_b: dict, context: str | None) -> dict:
    """
    Simple template-based proposal, used when no AI provider is available
    (rate limits, missing credits, network issues). Keeps the feature working
    end-to-end without depending on an external API being up.
    """
    name_a, cat_a = business_a["name"], business_a["category"].replace("_", " ")
    name_b, cat_b = business_b["name"], business_b["category"].replace("_", " ")

    return {
        "title": f"{cat_a.title()} x {cat_b.title()} Partnership Proposal",
        "summary": (
            f"{name_a} and {name_b} are exploring a referral-based partnership to "
            f"connect their respective clients, combining {cat_a} and {cat_b} services "
            f"for shared events."
        ),
        "terms": {
            "referral_structure": "Each business refers clients to the other with no upfront cost; details to be agreed directly between both parties.",
            "suggested_bundle": f"A joint {cat_a} + {cat_b} package offered to shared clients.",
            "next_steps": [
                "Schedule an introductory call between both businesses.",
                "Agree on referral terms and any bundled pricing.",
            ],
        },
    }