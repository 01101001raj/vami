"""
Agent Templates API

Endpoints for getting pre-configured agent templates
"""

from fastapi import APIRouter
from typing import List, Dict, Any
from app.templates_config.agent_templates import get_all_templates, get_template

router = APIRouter(prefix="/templates", tags=["Templates"])


@router.get("/agent-templates")
async def list_agent_templates() -> Dict[str, Any]:
    """
    Get all available agent templates

    Returns list of templates with:
    - Template key
    - Name and description
    - Icon
    - Sample conversations
    """
    templates = get_all_templates()

    # Format for frontend
    formatted_templates = []
    for key, template in templates.items():
        formatted_templates.append({
            "key": key,
            "name": template["name"],
            "description": template["description"],
            "icon": template["icon"],
            "sample_conversations": template["sample_conversations"]
        })

    return {
        "templates": formatted_templates,
        "total": len(formatted_templates)
    }


@router.get("/agent-templates/{template_key}")
async def get_agent_template(template_key: str) -> Dict[str, Any]:
    """
    Get a specific agent template by key

    Args:
        template_key: Template identifier (healthcare, legal, real_estate, general)
    """
    template = get_template(template_key)

    if not template:
        return {"error": "Template not found"}, 404

    return {
        "key": template_key,
        **template
    }
