from datetime import date
from typing import Annotated, Literal

from pydantic import BaseModel, Field, field_validator

Coordinate = tuple[
    Annotated[float, Field(ge=-90, le=90)],
    Annotated[float, Field(ge=-180, le=180)],
]


class PatientCreate(BaseModel):
    name: str = Field(min_length=1, max_length=101)
    dateOfBirth: date
    condition: str = Field(min_length=1, max_length=255)
    status: Literal[
        "Awaiting dispatch", "On scene", "In transit", "Admitted", "Discharged"
    ]
    medicalHistory: str = ""
    allergies: str = ""

    @field_validator("name")
    @classmethod
    def validate_name_parts(cls, value: str) -> str:
        parts = value.strip().split(maxsplit=1)
        if not parts or len(parts[0]) > 50 or (len(parts) > 1 and len(parts[1]) > 50):
            raise ValueError("Name parts must fit the patient name fields.")
        return " ".join(parts)


class PatientUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=101)
    age: int | None = Field(default=None, ge=0, le=130)
    condition: str | None = Field(default=None, min_length=1, max_length=255)
    status: Literal[
        "Awaiting dispatch", "On scene", "In transit", "Admitted", "Discharged"
    ] | None = None
    medicalHistory: str | None = None
    allergies: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name_parts(cls, value: str | None) -> str | None:
        if value is None:
            return value
        parts = value.strip().split(maxsplit=1)
        if not parts or len(parts[0]) > 50 or (len(parts) > 1 and len(parts[1]) > 50):
            raise ValueError("Name parts must fit the patient name fields.")
        return " ".join(parts)


class EmergencyCreate(BaseModel):
    patientName: str = Field(min_length=1, max_length=255)
    patientId: int | None = None
    address: str = Field(min_length=1, max_length=150)
    priority: Literal["High", "Medium", "Low"]
    status: Literal[
        "Awaiting dispatch", "En route", "On scene", "Transporting", "Completed"
    ] = "Awaiting dispatch"
    vehicle: str | None = None
    assignedParamedicBadge: str | None = None
    assignmentMessage: str = ""
    position: Coordinate

    @field_validator("patientName")
    @classmethod
    def validate_patient_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Patient name cannot be blank.")
        return normalized


class EmergencyUpdate(BaseModel):
    patientId: int | None = None
    patientName: str | None = Field(default=None, min_length=1, max_length=255)
    address: str | None = Field(default=None, min_length=1, max_length=150)
    position: Coordinate | None = None
    priority: Literal["High", "Medium", "Low"] | None = None
    status: Literal[
        "Awaiting dispatch", "En route", "On scene", "Transporting", "Completed"
    ] | None = None
    vehicle: str | None = None
    assignedParamedicBadge: str | None = None
    assignmentMessage: str | None = None

    @field_validator("patientName")
    @classmethod
    def validate_patient_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip()
        if not normalized:
            raise ValueError("Patient name cannot be blank.")
        return normalized


class VehicleUpdate(BaseModel):
    location: str | None = Field(default=None, min_length=1, max_length=120)
    status: Literal["Available", "En route", "On scene", "Out of service"] | None = None
    crew: int | None = Field(default=None, ge=0)
    notes: str | None = None
    assignedParamedicBadge: str | None = Field(default=None, max_length=40)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=256)
