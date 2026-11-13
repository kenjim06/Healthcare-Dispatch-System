from collections.abc import Callable
from contextlib import asynccontextmanager
import os
from typing import TypeVar

from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.engine import Connection

import auth
import database
from schemas import (
    EmergencyCreate,
    EmergencyUpdate,
    LoginRequest,
    PatientCreate,
    PatientUpdate,
    VehicleUpdate,
)

Result = TypeVar("Result")


@asynccontextmanager
async def lifespan(_: FastAPI):
    database.initialize_database()
    auth.initialize_auth_table()
    yield


app = FastAPI(
    title="Healthcare Dispatch API",
    version="0.2.0",
    lifespan=lifespan,
)

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        ",".join(
            (
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "https://hne-database-website-111226.web.app",
                "https://hne-database-website-111226.firebaseapp.com",
            )
        ),
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _reject_nulls(updates: dict, fields: set[str]) -> None:
    if any(updates[field] is None for field in fields if field in updates):
        raise HTTPException(status_code=422, detail="This field cannot be null.")


def _not_found(message: str) -> HTTPException:
    return HTTPException(status_code=404, detail=message)


def _assigned_patient_ids(connection: Connection, badge: str) -> set[int]:
    return {
        emergency["patientId"]
        for emergency in database.list_emergencies(connection)
        if emergency["assignedParamedicBadge"] == badge
        and emergency["patientId"] is not None
    }


def _run_database_write(operation: Callable[[Connection], Result]) -> Result:
    try:
        with database.engine.begin() as connection:
            return operation(connection)
    except database.DispatchConflictError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@app.post("/api/auth/login")
def login(values: LoginRequest):
    user = auth.authenticate(values.email, values.password)
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Email or password is incorrect.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"token": auth.create_token(user["email"]), "user": user}


@app.get("/api/auth/me")
def current_user(user: dict = Depends(auth.get_user_for_token)):
    return user


@app.get("/api/health")
def health_check():
    with database.engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "ok", "storage": "mysql"}


@app.get("/api/patients")
def get_patients(user: dict = Depends(auth.get_user_for_token)):
    with database.engine.connect() as connection:
        patients = database.list_patients(connection)
        if user["role"] == "Lead Paramedic":
            assigned_patient_ids = _assigned_patient_ids(connection, user["badge"])
            return [
                patient for patient in patients if patient["id"] in assigned_patient_ids
            ]
        if user["role"] == "Dispatcher":
            return [
                {
                    "id": patient["id"],
                    "name": patient["name"],
                    "condition": patient["condition"],
                }
                for patient in patients
            ]
        return patients


@app.post("/api/patients", status_code=201)
def create_patient(
    values: PatientCreate,
    _user: dict = Depends(auth.require_roles("Dispatcher", "Lead Paramedic")),
):
    return _run_database_write(
        lambda connection: database.create_patient(connection, values.model_dump())
    )


@app.put("/api/patients/{patient_id}")
def update_patient(
    patient_id: int,
    updates: PatientUpdate,
    user: dict = Depends(auth.require_roles("Lead Paramedic")),
):
    with database.engine.connect() as connection:
        assigned_patient_ids = _assigned_patient_ids(connection, user["badge"])
    if patient_id not in assigned_patient_ids:
        raise HTTPException(
            status_code=403,
            detail="Paramedics may update only patients associated with their assigned emergencies.",
        )
    changes = updates.model_dump(exclude_unset=True)
    _reject_nulls(
        changes,
        {"name", "age", "condition", "status", "medicalHistory", "allergies"},
    )
    patient = _run_database_write(
        lambda connection: database.update_patient(connection, patient_id, changes)
    )
    if patient is None:
        raise _not_found("Patient not found.")
    return patient


@app.get("/api/emergencies")
def get_emergencies(
    include_closed: bool = False,
    user: dict = Depends(auth.get_user_for_token),
):
    with database.engine.connect() as connection:
        emergencies = database.list_emergencies(connection, include_closed)
    if user["role"] == "Lead Paramedic":
        emergencies = [
            emergency
            for emergency in emergencies
            if emergency["assignedParamedicBadge"] == user["badge"]
        ]
    return emergencies


@app.post("/api/emergencies", status_code=201)
def create_emergency(
    values: EmergencyCreate,
    user: dict = Depends(auth.require_roles("Dispatcher", "Lead Paramedic")),
):
    emergency_values = values.model_dump()
    with database.engine.connect() as connection:
        fleet = database.list_vehicles(connection)
        assigned_vehicle = next(
            (
                vehicle
                for vehicle in fleet
                if vehicle["id"] == emergency_values["vehicle"]
            ),
            None,
        )
        if user["role"] == "Lead Paramedic":
            own_vehicles = [
                vehicle for vehicle in fleet if vehicle["badge"] == user["badge"]
            ]
            if (
                not emergency_values["vehicle"]
                or emergency_values["vehicle"]
                not in {vehicle["id"] for vehicle in own_vehicles}
            ):
                raise HTTPException(
                    status_code=403,
                    detail="Paramedics may create emergencies only with their assigned vehicle.",
                )
            if (
                emergency_values["patientId"] is not None
                and emergency_values["patientId"]
                not in _assigned_patient_ids(connection, user["badge"])
            ):
                raise HTTPException(
                    status_code=403,
                    detail="Paramedics may link only patients already assigned to their unit.",
                )
            emergency_values["assignedParamedicBadge"] = user["badge"]
        else:
            expected_badge = assigned_vehicle["badge"] if assigned_vehicle else None
            if emergency_values["assignedParamedicBadge"] != expected_badge:
                raise HTTPException(
                    status_code=422,
                    detail="The assigned paramedic must match the selected vehicle.",
                )
    emergency = _run_database_write(
        lambda connection: database.create_emergency(connection, emergency_values)
    )
    if emergency is None:
        raise _not_found("Patient not found.")
    return emergency


@app.put("/api/emergencies/{emergency_id}")
def update_emergency(
    emergency_id: int,
    updates: EmergencyUpdate,
    user: dict = Depends(
        auth.require_roles("Dispatcher", "Lead Paramedic")
    ),
):
    changes = updates.model_dump(exclude_unset=True)
    _reject_nulls(
        changes,
        {"patientId", "patientName", "address", "position", "priority", "status"},
    )
    if user["role"] == "Lead Paramedic":
        with database.engine.connect() as connection:
            existing = next(
                (
                    emergency
                    for emergency in database.list_emergencies(
                        connection, include_closed=True
                    )
                    if emergency["id"] == emergency_id
                ),
                None,
            )
            assigned_patient_ids = _assigned_patient_ids(connection, user["badge"])
        if existing is None:
            raise _not_found("Emergency not found.")
        if existing["assignedParamedicBadge"] != user["badge"]:
            raise HTTPException(
                status_code=403,
                detail="Paramedics may update only emergencies assigned to their badge.",
            )
        if changes.get("vehicle", existing["vehicle"]) != existing["vehicle"]:
            raise HTTPException(
                status_code=403,
                detail="Only dispatchers may assign or change EMS vehicles.",
            )
        if (
            changes.get("patientId", existing["patientId"]) is not None
            and changes.get("patientId", existing["patientId"])
            not in assigned_patient_ids
            and changes.get("patientId") != existing["patientId"]
        ):
            raise HTTPException(
                status_code=403,
                detail="Paramedics may link only patients already assigned to their unit.",
            )
        changes["assignedParamedicBadge"] = user["badge"]
    else:
        with database.engine.connect() as connection:
            existing = next(
                (
                    emergency
                    for emergency in database.list_emergencies(
                        connection, include_closed=True
                    )
                    if emergency["id"] == emergency_id
                ),
                None,
            )
            if existing is None:
                raise _not_found("Emergency not found.")
            vehicle_number = changes.get("vehicle", existing["vehicle"])
            assigned_vehicle = next(
                (
                    vehicle
                    for vehicle in database.list_vehicles(connection)
                    if vehicle["id"] == vehicle_number
                ),
                None,
            )
            expected_badge = assigned_vehicle["badge"] if assigned_vehicle else None
        if (
            "assignedParamedicBadge" in changes
            and changes["assignedParamedicBadge"] != expected_badge
        ):
            raise HTTPException(
                status_code=422,
                detail="The assigned paramedic must match the selected vehicle.",
            )
        changes["assignedParamedicBadge"] = expected_badge
    emergency = _run_database_write(
        lambda connection: database.update_emergency(
            connection, emergency_id, changes
        )
    )
    if emergency is None:
        raise _not_found("Emergency or patient not found.")
    return emergency


@app.delete("/api/emergencies/{emergency_id}", status_code=204)
def delete_emergency(
    emergency_id: int,
    _user: dict = Depends(auth.require_roles("Dispatcher")),
):
    deleted = _run_database_write(
        lambda connection: database.delete_emergency(connection, emergency_id)
    )
    if not deleted:
        raise _not_found("Emergency not found.")
    return Response(status_code=204)


@app.get("/api/vehicles")
def get_vehicles(user: dict = Depends(auth.get_user_for_token)):
    with database.engine.connect() as connection:
        vehicles = database.list_vehicles(connection)
    if user["role"] == "Lead Paramedic":
        vehicles = [
            vehicle for vehicle in vehicles if vehicle["badge"] == user["badge"]
        ]
    return vehicles


@app.get("/api/paramedics")
def get_paramedic_accounts(
    _user: dict = Depends(auth.require_roles("Dispatcher")),
):
    with database.engine.connect() as connection:
        return auth.list_paramedic_accounts(connection)


@app.put("/api/vehicles/{vehicle_id}")
def update_vehicle(
    vehicle_id: str,
    updates: VehicleUpdate,
    _user: dict = Depends(auth.require_roles("Dispatcher")),
):
    changes = updates.model_dump(exclude_unset=True)
    _reject_nulls(changes, {"location", "status", "crew", "notes"})
    if "assignedParamedicBadge" in changes and changes["assignedParamedicBadge"] is not None:
        with database.engine.connect() as connection:
            paramedic_badges = {
                paramedic["badge"]
                for paramedic in auth.list_paramedic_accounts(connection)
            }
            if changes["assignedParamedicBadge"] not in paramedic_badges:
                raise HTTPException(
                    status_code=422,
                    detail="Choose an active Lead Paramedic account.",
                )
            assigned_elsewhere = any(
                vehicle["id"] != vehicle_id
                and vehicle["badge"] == changes["assignedParamedicBadge"]
                for vehicle in database.list_vehicles(connection)
            )
        if assigned_elsewhere:
            raise HTTPException(
                status_code=409,
                detail="This paramedic account is already assigned to another vehicle.",
            )
    vehicle = _run_database_write(
        lambda connection: database.update_vehicle(
            connection, vehicle_id, changes
        )
    )
    if vehicle is None:
        raise _not_found("Vehicle not found.")
    return vehicle


@app.get("/api/hospitals")
def get_hospitals(user: dict = Depends(auth.get_user_for_token)):
    with database.engine.connect() as connection:
        hospitals = database.list_hospitals(connection)
        if user["role"] == "Lead Paramedic":
            vehicle = next(
                (
                    unit
                    for unit in database.list_vehicles(connection)
                    if unit["badge"] == user["badge"]
                ),
                None,
            )
            if vehicle is None or not vehicle["area"]:
                return []
            return [
                hospital
                for hospital in hospitals
                if hospital["area"] == vehicle["area"]
            ]
        return hospitals
