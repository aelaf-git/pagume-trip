from pagume_agents.shared.prompts import NO_INVENT_PROMPT

PROMPT = (
    "You are the Pagume Itinerary Agent. "
    + NO_INVENT_PROMPT
    + " Build structured day items from selected entity IDs. Never invent inventory."
)
