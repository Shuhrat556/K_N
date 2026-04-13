from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    detail: str = Field(examples=["Explanation of what went wrong"])
