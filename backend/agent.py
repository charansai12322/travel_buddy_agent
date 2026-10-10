import os
import json
from typing import Any
from pathlib import Path
from dotenv import load_dotenv

from langchain.agents import create_agent
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_tavily import TavilySearch
from serpapi import GoogleSearch

# Load environment variables from backend/.env or root .env if present
env_backend = Path(__file__).resolve().parent / ".env"
env_root = Path(__file__).resolve().parent.parent / ".env"
if env_backend.exists():
    load_dotenv(dotenv_path=env_backend)
elif env_root.exists():
    load_dotenv(dotenv_path=env_root)
else:
    load_dotenv()

# System prompt extracted verbatim from travel_buddy.ipynb
SYSTEM_PROMPT = """
You are a TravelBuddy assistant that helps travelers plan trips.

You have access to these tools:
- search_tool: Use it to search for attractions, culture, food, and travel tips.
- serpapi_flights_tool: Use it to search for flights using the Google Flights API.
  It requires origin, destination, and date.

Help the traveler by researching destinations and finding flights.
Present results in a clear, readable format with clear sections.
Do not use too much formatting.

When discussing flight prices, availability, or schedules, state that they can
change and should be verified before booking.
"""


# SerpAPI flights tool matching notebook implementation
@tool("serpapi_flights_tool")
def serpapi_flights_tool(origin: str, destination: str, date: str) -> str:
    """
    Search Google Flights through SerpAPI.

    Args:
        origin: Departure airport or city code, for example "HYD".
        destination: Arrival airport or city code, for example "GOI".
        date: One-way departure date in YYYY-MM-DD format.
    """
    serpapi_key = os.getenv("SERPAPI_API_KEY")
    if not serpapi_key:
        return "Flight search failed: SERPAPI_API_KEY environment variable is missing."

    params = {
        "engine": "google_flights",
        "departure_id": origin,
        "arrival_id": destination,
        "outbound_date": date,
        "type": 2,          # one-way flight search
        "currency": "INR",
        "hl": "en",
        "api_key": serpapi_key,
    }

    try:
        results = GoogleSearch(params).get_dict()

        if results.get("error"):
            return f"SerpAPI returned an error: {results['error']}"

        # Keep the response compact enough for the agent while preserving results.
        useful_results = {
            "best_flights": results.get("best_flights", [])[:5],
            "other_flights": results.get("other_flights", [])[:5],
            "price_insights": results.get("price_insights", {}),
            "search_metadata": results.get("search_metadata", {}),
        }

        return json.dumps(useful_results, indent=2, default=str)

    except Exception as error:
        return f"Flight search failed: {type(error).__name__}: {error}"


_agent_instance = None


def get_agent():
    """
    Initializes and returns the Travel Buddy agent instance.
    Reuses existing instance if already initialized.
    """
    global _agent_instance
    if _agent_instance is not None:
        return _agent_instance

    google_api_key = os.getenv("GOOGLE_API_KEY")
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    serpapi_api_key = os.getenv("SERPAPI_API_KEY")

    missing_keys = []
    if not google_api_key:
        missing_keys.append("GOOGLE_API_KEY")
    if not tavily_api_key:
        missing_keys.append("TAVILY_API_KEY")
    if not serpapi_api_key:
        missing_keys.append("SERPAPI_API_KEY")

    if missing_keys:
        raise RuntimeError(
            f"Missing required API key(s): {', '.join(missing_keys)}. "
            "Please configure them in backend/.env file."
        )

    # Ensure Tavily search tool gets key via environment variable
    os.environ["TAVILY_API_KEY"] = tavily_api_key

    search_tool = TavilySearch(
        name="search_tool",
        max_results=5,
        search_depth="advanced",
        description=(
            "Search for destination attractions, culture, food, local transport, "
            "travel tips, and other travel-planning information."
        ),
    )

    model_name = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    travel_model = ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=google_api_key,
        temperature=0,
    )

    _agent_instance = create_agent(
        model=travel_model,
        tools=[search_tool, serpapi_flights_tool],
        system_prompt=SYSTEM_PROMPT,
    )

    return _agent_instance


def extract_response_text(content: Any) -> str:
    """
    Safely extracts plain text response from various LangChain message content formats.
    """
    if isinstance(content, str):
        cleaned = content.strip()
        if cleaned:
            return cleaned
        raise ValueError("Agent returned an empty response string.")

    if isinstance(content, list):
        text_parts = []
        for block in content:
            if isinstance(block, str):
                text_parts.append(block)
            elif isinstance(block, dict):
                if block.get("type") == "text" and "text" in block:
                    text_parts.append(str(block["text"]))
                elif "text" in block:
                    text_parts.append(str(block["text"]))
            elif hasattr(block, "text"):
                text_parts.append(str(getattr(block, "text")))
        combined = "\n".join(text_parts).strip()
        if combined:
            return combined
        raise ValueError("Agent returned a content list with no extractable text.")

    if hasattr(content, "text"):
        return str(getattr(content, "text")).strip()

    result_str = str(content).strip()
    if result_str:
        return result_str
    raise ValueError("Failed to extract text response from agent output.")


def run_travel_buddy(query: str) -> str:
    """
    Public entrypoint for executing a travel query with the agent.

    Args:
        query: User travel request string.

    Returns:
        Extracted response string.
    """
    if not query or not isinstance(query, str) or not query.strip():
        raise ValueError("Query must be a non-empty string.")

    query = query.strip()
    if len(query) > 2000:
        raise ValueError("Query length exceeds maximum allowed limit of 2000 characters.")

    agent = get_agent()

    try:
        response = agent.invoke(
            {
                "messages": [
                    {"role": "user", "content": query}
                ]
            }
        )
    except Exception as exc:
        raise RuntimeError(f"Agent execution failed: {str(exc)}") from exc

    if not response or "messages" not in response or not response["messages"]:
        raise RuntimeError("Agent returned an invalid or empty response structure.")

    last_message = response["messages"][-1]
    raw_content = getattr(last_message, "content", last_message)

    return extract_response_text(raw_content)
