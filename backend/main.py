import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from agent import run_travel_buddy

# Set up clean logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("travel_buddy_backend")

app = FastAPI(
    title="Travel Buddy AI Backend",
    description="API server exposing the Travel Buddy AI Agent",
    version="1.0.0",
)

# Configure CORS strictly for local React frontend development
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    query: str = Field(
        ...,
        description="The travel query or trip request.",
        example="Plan a three-day trip to Goa from Hyderabad on 2026-12-15.",
    )

    @field_validator("query")
    @classmethod
    def validate_query(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Query cannot be empty or whitespace only.")
        stripped = value.strip()
        if len(stripped) > 2000:
            raise ValueError("Query exceeds maximum length of 2000 characters.")
        return stripped


class QueryResponse(BaseModel):
    response: str = Field(..., description="The travel agent response.")


class HealthResponse(BaseModel):
    status: str = Field(..., description="Server status indicator.")


@app.get(
    "/api/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Server health check",
)
def health_check() -> HealthResponse:
    """
    Confirms that the FastAPI backend server is running and accepting HTTP requests.
    """
    return HealthResponse(status="ok")


@app.post(
    "/api/query",
    response_model=QueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute Travel Buddy query",
)
def execute_query(payload: QueryRequest) -> QueryResponse:
    """
    Accepts a user travel request and passes it to the Travel Buddy AI agent.
    """
    try:
        agent_output = run_travel_buddy(payload.query)
        return QueryResponse(response=agent_output)
    except ValueError as val_err:
        logger.warning(f"Invalid query request: {val_err}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        ) from val_err
    except RuntimeError as run_err:
        logger.error(f"Backend configuration/agent runtime error: {run_err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(run_err),
        ) from run_err
    except Exception as exc:
        logger.error(f"Unexpected error during query execution: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected server error occurred while processing your travel query.",
        ) from exc


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
