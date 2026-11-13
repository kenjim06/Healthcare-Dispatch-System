from datetime import date

from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    func,
    insert,
    inspect,
    select,
    text,
    update,
)
from sqlalchemy.dialects.mysql import INTEGER as MySQLInteger
from sqlalchemy.engine import Connection

from db_connection import engine

metadata = MetaData()
tables: dict[str, Table] = {}


class DispatchConflictError(Exception):
    pass


def initialize_database() -> None:
    metadata.reflect(bind=engine)
    required_tables = {
        "patient",
        "patient_encounter",
        "emergency_incident",
        "dispatch",
        "ems_unit",
        "hospital",
        "hospital_resource",
        "resource",
    }
    missing_tables = required_tables - set(metadata.tables)
    if missing_tables:
        raise RuntimeError(
            "The configured MySQL database is missing required tables: "
            + ", ".join(sorted(missing_tables))
        )

    patient_id_type = MySQLInteger(unsigned=True)
    incident_id_type = MySQLInteger(unsigned=True)
    unit_id_type = MySQLInteger(unsigned=True)
    profile_tables = (
        Table(
            "api_patient_profile",
            metadata,
            Column(
                "patient_id",
                patient_id_type,
                ForeignKey("patient.patient_id", ondelete="CASCADE"),
                primary_key=True,
            ),
            Column("condition", String(255), nullable=False, default=""),
            Column("status", String(40), nullable=False, default=""),
            Column("medical_history", Text, nullable=False, default=""),
            Column("allergies", Text, nullable=False, default=""),
            Column("age_override", Integer, nullable=True),
            extend_existing=True,
        ),
        Table(
            "api_incident_profile",
            metadata,
            Column(
                "incident_id",
                incident_id_type,
                ForeignKey("emergency_incident.incident_id", ondelete="CASCADE"),
                primary_key=True,
            ),
            Column("patient_name", String(255), nullable=True),
            Column("assigned_paramedic_badge", String(40), nullable=True),
            Column("assignment_message", Text, nullable=False, default=""),
            extend_existing=True,
        ),
        Table(
            "api_unit_profile",
            metadata,
            Column(
                "unit_id",
                unit_id_type,
                ForeignKey("ems_unit.unit_id", ondelete="CASCADE"),
                primary_key=True,
            ),
            Column("location_label", String(120), nullable=False, default=""),
            Column("crew_count", Integer, nullable=False, default=0),
            Column("notes", Text, nullable=False, default=""),
            Column("assigned_paramedic_badge", String(40), nullable=True),
            Column("service_area", String(80), nullable=False, default=""),
            extend_existing=True,
        ),
    )
    metadata.create_all(bind=engine, tables=list(profile_tables))
    patient_profile_columns = {
        column["name"]
        for column in inspect(engine).get_columns("api_patient_profile")
    }
    if "age_override" not in patient_profile_columns:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE api_patient_profile ADD COLUMN age_override INTEGER NULL")
            )
    incident_profile_columns = {
        column["name"]
        for column in inspect(engine).get_columns("api_incident_profile")
    }
    if "patient_name" not in incident_profile_columns:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE api_incident_profile ADD COLUMN patient_name VARCHAR(255) NULL")
            )
    tables.update(metadata.tables)


def get_connection() -> Connection:
    return engine.connect()


def _column(table: str, column: str):
    return tables[table].c[column]


def _rows(connection: Connection, statement) -> list[dict]:
    return [dict(row._mapping) for row in connection.execute(statement)]


def _profile_value(row: dict, key: str, fallback=""):
    value = row.get(key)
    return fallback if value is None else value


def _age(birth_date: date | None) -> int | None:
    if birth_date is None:
        return None
    today = date.today()
    return today.year - birth_date.year - (
        (today.month, today.day) < (birth_date.month, birth_date.day)
    )


def _latest_ids(table_name: str, parent_column: str, id_column: str):
    table = tables[table_name]
    return (
        select(
            table.c[parent_column].label(parent_column),
            func.max(table.c[id_column]).label(id_column),
        )
        .group_by(table.c[parent_column])
        .subquery()
    )


def _patient_rows(connection: Connection, patient_id: int | None = None) -> list[dict]:
    patient = tables["patient"]
    profile = tables["api_patient_profile"]
    encounter = tables["patient_encounter"]
    latest = _latest_ids("patient_encounter", "patient_id", "encounter_id")
    statement = (
        select(
            patient.c.patient_id.label("id"),
            patient.c.first_name,
            patient.c.last_name,
            patient.c.date_of_birth,
            profile.c.condition.label("profile_condition"),
            profile.c.status.label("profile_status"),
            profile.c.age_override,
            profile.c.medical_history,
            profile.c.allergies,
            encounter.c.chief_complaint,
            encounter.c.encounter_status,
        )
        .select_from(
            patient.outerjoin(profile, patient.c.patient_id == profile.c.patient_id)
            .outerjoin(latest, patient.c.patient_id == latest.c.patient_id)
            .outerjoin(
                encounter,
                encounter.c.encounter_id == latest.c.encounter_id,
            )
        )
        .order_by(patient.c.patient_id)
    )
    if patient_id is not None:
        statement = statement.where(patient.c.patient_id == patient_id)

    records = _rows(connection, statement)
    for record in records:
        record["name"] = " ".join(
            part for part in (record.pop("first_name"), record.pop("last_name")) if part
        )
        age_override = record.pop("age_override")
        birth_date = record.pop("date_of_birth")
        record["age"] = age_override if age_override is not None else _age(birth_date)
        record["condition"] = _profile_value(
            record, "profile_condition", record.pop("chief_complaint") or ""
        )
        stored_status = record.pop("profile_status")
        encounter_status = record.pop("encounter_status")
        record["status"] = stored_status or {
            "Waiting": "Awaiting dispatch",
            "In Treatment": "On scene",
            "Admitted": "Admitted",
            "Discharged": "Discharged",
            "Transferred": "In transit",
        }.get(encounter_status, "Awaiting dispatch")
        record["medicalHistory"] = record.pop("medical_history") or ""
        record["allergies"] = record.pop("allergies") or ""
    return records


def list_patients(connection: Connection) -> list[dict]:
    return _patient_rows(connection)


def create_patient(connection: Connection, values: dict) -> dict:
    patient = tables["patient"]
    names = values["name"].strip().split(maxsplit=1)
    result = connection.execute(
        insert(patient).values(
            first_name=names[0],
            last_name=names[1] if len(names) > 1 else "",
            date_of_birth=values["dateOfBirth"],
            sex="Unknown",
            blood_type="Unknown",
        )
    )
    patient_id = result.inserted_primary_key[0]
    connection.execute(
        insert(tables["api_patient_profile"]).values(
            patient_id=patient_id,
            condition=values["condition"],
            status=values["status"],
            medical_history=values["medicalHistory"],
            allergies=values["allergies"],
            age_override=None,
        )
    )
    return _patient_rows(connection, patient_id)[0]


def update_patient(connection: Connection, patient_id: int, changes: dict) -> dict | None:
    patient = tables["patient"]
    if connection.execute(
        select(patient.c.patient_id).where(patient.c.patient_id == patient_id)
    ).first() is None:
        return None

    patient_changes = {}
    if "name" in changes:
        names = changes["name"].strip().split(maxsplit=1)
        patient_changes.update(
            first_name=names[0],
            last_name=names[1] if len(names) > 1 else "",
        )
    if patient_changes:
        connection.execute(
            update(patient)
            .where(patient.c.patient_id == patient_id)
            .values(**patient_changes)
        )

    profile_changes = {}
    mapping = {
        "condition": "condition",
        "status": "status",
        "age": "age_override",
        "medicalHistory": "medical_history",
        "allergies": "allergies",
    }
    for api_key, column in mapping.items():
        if api_key in changes:
            profile_changes[column] = changes[api_key]
    if profile_changes:
        _upsert(
            connection,
            "api_patient_profile",
            {"patient_id": patient_id, **profile_changes},
        )
    return _patient_rows(connection, patient_id)[0]


def _emergency_rows(
    connection: Connection, include_closed: bool = False
) -> list[dict]:
    incident = tables["emergency_incident"]
    patient = tables["patient"]
    dispatch = tables["dispatch"]
    unit = tables["ems_unit"]
    profile = tables["api_incident_profile"]
    latest = _latest_ids("dispatch", "incident_id", "dispatch_id")
    statement = (
        select(
            incident.c.incident_id.label("id"),
            incident.c.priority_level,
            incident.c.incident_address,
            incident.c.latitude,
            incident.c.longitude,
            incident.c.incident_status,
            incident.c.reported_at,
            incident.c.patient_id,
            incident.c.incident_type,
            patient.c.first_name,
            patient.c.last_name,
            dispatch.c.dispatch_status,
            unit.c.unit_number,
            profile.c.assigned_paramedic_badge,
            profile.c.assignment_message,
            profile.c.patient_name,
        )
        .select_from(
            incident.outerjoin(patient, incident.c.patient_id == patient.c.patient_id)
            .outerjoin(
                latest,
                incident.c.incident_id == latest.c.incident_id,
            )
            .outerjoin(dispatch, dispatch.c.dispatch_id == latest.c.dispatch_id)
            .outerjoin(unit, unit.c.unit_id == dispatch.c.unit_id)
            .outerjoin(profile, incident.c.incident_id == profile.c.incident_id)
        )
        .where(incident.c.incident_status != "Cancelled")
        .order_by(incident.c.incident_id)
    )
    records = _rows(connection, statement)
    for record in records:
        first_name = record.pop("first_name")
        last_name = record.pop("last_name")
        linked_patient_name = " ".join(
            part for part in (first_name, last_name) if part
        )
        profile_patient_name = record.pop("patient_name")
        record["patient"] = linked_patient_name or profile_patient_name or ""
        record["patientId"] = record.pop("patient_id")
        record["address"] = record.pop("incident_address")
        record["priority"] = {
            "Low": "Low",
            "Moderate": "Medium",
            "High": "High",
            "Critical": "High",
        }.get(record.pop("priority_level"), "Medium")
        dispatch_status = record.pop("dispatch_status")
        unit_number = record.pop("unit_number")
        record["status"] = _emergency_status(
            dispatch_status, record.pop("incident_status")
        )
        record["position"] = [
            float(record.pop("latitude") or 35.8456),
            float(record.pop("longitude") or -86.3903),
        ]
        reported = record.pop("reported_at")
        record["reported"] = reported.strftime("%H:%M") if reported else ""
        record["vehicle"] = (
            None if dispatch_status == "Cancelled" else unit_number
        )
        record["assignedParamedicBadge"] = record.pop("assigned_paramedic_badge")
        record["assignmentMessage"] = record.pop("assignment_message") or ""
        record.pop("incident_type")
    if not include_closed:
        records = [record for record in records if record["status"] != "Completed"]
    return records


def _emergency_status(dispatch_status: str | None, incident_status: str) -> str:
    dispatch_states = {
        "Assigned": "Awaiting dispatch",
        "En Route": "En route",
        "On Scene": "On scene",
        "Transporting": "Transporting",
        "Completed": "Completed",
        "Cancelled": "Awaiting dispatch",
    }
    if dispatch_status == "Cancelled":
        return "Completed" if incident_status == "Closed" else "Awaiting dispatch"
    if dispatch_status:
        return dispatch_states[dispatch_status]
    return {
        "Reported": "Awaiting dispatch",
        "Active": "En route",
        "Transporting": "Transporting",
        "Closed": "Completed",
        "Cancelled": "Completed",
    }[incident_status]


def list_emergencies(
    connection: Connection, include_closed: bool = False
) -> list[dict]:
    return _emergency_rows(connection, include_closed)


def _upsert(connection: Connection, table_name: str, values: dict) -> None:
    table = tables[table_name]
    primary_key = next(iter(table.primary_key.columns)).name
    exists = connection.execute(
        select(table.c[primary_key]).where(table.c[primary_key] == values[primary_key])
    ).first()
    if exists:
        changes = {key: value for key, value in values.items() if key != primary_key}
        if changes:
            connection.execute(
                update(table)
                .where(table.c[primary_key] == values[primary_key])
                .values(**changes)
            )
    else:
        connection.execute(insert(table).values(**values))


def _unit_id(connection: Connection, unit_number: str | None) -> int | None:
    if unit_number is None:
        return None
    unit = tables["ems_unit"]
    found = connection.execute(
        select(unit.c.unit_id).where(unit.c.unit_number == unit_number)
    ).scalar_one_or_none()
    return found


def _assignable_unit_id(
    connection: Connection,
    unit_number: str | None,
    current_unit_id: int | None = None,
) -> int | None:
    if unit_number is None:
        return None
    unit = tables["ems_unit"]
    record = connection.execute(
        select(unit.c.unit_id, unit.c.unit_status)
        .where(unit.c.unit_number == unit_number)
        .with_for_update()
    ).first()
    if record is None:
        raise ValueError("Vehicle not found.")
    if record.unit_id != current_unit_id:
        active_assignment = connection.execute(
            select(tables["dispatch"].c.dispatch_id)
            .where(
                tables["dispatch"].c.unit_id == record.unit_id,
                tables["dispatch"].c.dispatch_status.notin_(
                    ("Completed", "Cancelled")
                ),
            )
            .limit(1)
        ).first()
        if record.unit_status != "Available" or active_assignment is not None:
            raise DispatchConflictError(
                "This vehicle is not available for a new dispatch."
            )
    return record.unit_id


def _dispatch_status(status: str) -> str:
    return {
        "Awaiting dispatch": "Assigned",
        "En route": "En Route",
        "On scene": "On Scene",
        "Transporting": "Transporting",
        "Completed": "Completed",
    }[status]


def _incident_status(status: str) -> str:
    return {
        "Awaiting dispatch": "Reported",
        "En route": "Active",
        "On scene": "Active",
        "Transporting": "Transporting",
        "Completed": "Closed",
    }[status]


def _priority_for_database(priority: str) -> str:
    return {"Low": "Low", "Medium": "Moderate", "High": "High"}[priority]


def _get_incident(connection: Connection, incident_id: int) -> dict | None:
    return next(
        (
            row
            for row in _emergency_rows(connection, include_closed=True)
            if row["id"] == incident_id
        ),
        None,
    )


def create_emergency(connection: Connection, values: dict) -> dict:
    unit_id = _assignable_unit_id(connection, values["vehicle"])
    position = values["position"] or [35.8456, -86.3903]
    incident = tables["emergency_incident"]
    patient_id = values.get("patientId")
    if patient_id is not None and connection.execute(
        select(tables["patient"].c.patient_id).where(
            tables["patient"].c.patient_id == patient_id
        )
    ).first() is None:
        raise ValueError("Patient not found.")
    result = connection.execute(
        insert(incident).values(
            patient_id=patient_id,
            incident_type=values.get("condition") or "Emergency response",
            priority_level=_priority_for_database(values["priority"]),
            incident_description=values.get("assignmentMessage", ""),
            incident_address=values["address"],
            latitude=position[0],
            longitude=position[1],
            incident_status=_incident_status(values["status"]),
        )
    )
    incident_id = result.inserted_primary_key[0]
    connection.execute(
        insert(tables["api_incident_profile"]).values(
            incident_id=incident_id,
            patient_name=values["patientName"],
            assigned_paramedic_badge=values["assignedParamedicBadge"],
            assignment_message=values["assignmentMessage"],
        )
    )
    if unit_id is not None:
        connection.execute(
            insert(tables["dispatch"]).values(
                incident_id=incident_id,
                unit_id=unit_id,
                dispatch_status=_dispatch_status(values["status"]),
            )
        )
        connection.execute(
            update(tables["ems_unit"])
            .where(tables["ems_unit"].c.unit_id == unit_id)
            .values(unit_status=_unit_status(values["status"]))
        )
    return _get_incident(connection, incident_id)


def _unit_status(status: str) -> str:
    return {
        "Awaiting dispatch": "Dispatched",
        "En route": "En Route",
        "On scene": "On Scene",
        "Transporting": "Transporting Patient",
        "Completed": "Available",
    }[status]


def _release_unit_if_unassigned(
    connection: Connection, unit_id: int | None, incident_id: int
) -> None:
    if unit_id is None:
        return
    dispatch = tables["dispatch"]
    active_assignment = connection.execute(
        select(dispatch.c.dispatch_id)
        .where(
            dispatch.c.unit_id == unit_id,
            dispatch.c.incident_id != incident_id,
            dispatch.c.dispatch_status.notin_(("Completed", "Cancelled")),
        )
        .limit(1)
    ).first()
    if active_assignment is None:
        connection.execute(
            update(tables["ems_unit"])
            .where(tables["ems_unit"].c.unit_id == unit_id)
            .values(unit_status="Available")
        )


def update_emergency(
    connection: Connection, incident_id: int, changes: dict
) -> dict | None:
    existing = _get_incident(connection, incident_id)
    if existing is None:
        return None

    incident = tables["emergency_incident"]
    incident_changes = {}
    if "address" in changes:
        incident_changes["incident_address"] = changes["address"]
    if "position" in changes:
        incident_changes["latitude"] = changes["position"][0]
        incident_changes["longitude"] = changes["position"][1]
    if "priority" in changes:
        incident_changes["priority_level"] = _priority_for_database(changes["priority"])
    if "status" in changes:
        incident_changes["incident_status"] = _incident_status(changes["status"])
    if "patientId" in changes:
        if connection.execute(
            select(tables["patient"].c.patient_id).where(
                tables["patient"].c.patient_id == changes["patientId"]
            )
        ).first() is None:
            return None
        incident_changes["patient_id"] = changes["patientId"]
    if incident_changes:
        connection.execute(
            update(incident)
            .where(incident.c.incident_id == incident_id)
            .values(**incident_changes)
        )

    profile_changes = {}
    if "patientName" in changes:
        profile_changes["patient_name"] = changes["patientName"]
    if "assignedParamedicBadge" in changes:
        profile_changes["assigned_paramedic_badge"] = changes["assignedParamedicBadge"]
    if "assignmentMessage" in changes:
        profile_changes["assignment_message"] = changes["assignmentMessage"]
    if profile_changes:
        _upsert(
            connection,
            "api_incident_profile",
            {"incident_id": incident_id, **profile_changes},
        )

    if "vehicle" in changes or "status" in changes:
        dispatch = tables["dispatch"]
        current_dispatch = connection.execute(
            select(dispatch.c.dispatch_id, dispatch.c.unit_id)
            .where(dispatch.c.incident_id == incident_id)
            .order_by(dispatch.c.dispatch_id.desc())
            .limit(1)
        ).first()
        vehicle_id = changes.get("vehicle", existing["vehicle"])
        unit_id = _assignable_unit_id(
            connection,
            vehicle_id,
            current_dispatch.unit_id if current_dispatch else None,
        )
        status = changes.get("status", existing["status"])
        if vehicle_id is None:
            if current_dispatch:
                connection.execute(
                    update(dispatch)
                    .where(dispatch.c.dispatch_id == current_dispatch.dispatch_id)
                    .values(dispatch_status="Cancelled")
                )
                _release_unit_if_unassigned(
                    connection, current_dispatch.unit_id, incident_id
                )
        elif current_dispatch:
            if current_dispatch.unit_id != unit_id:
                _release_unit_if_unassigned(
                    connection, current_dispatch.unit_id, incident_id
                )
            connection.execute(
                update(dispatch)
                .where(dispatch.c.dispatch_id == current_dispatch.dispatch_id)
                .values(
                    unit_id=unit_id,
                    dispatch_status=_dispatch_status(status),
                )
            )
        else:
            connection.execute(
                insert(dispatch).values(
                    incident_id=incident_id,
                    unit_id=unit_id,
                    dispatch_status=_dispatch_status(status),
                )
            )
        if unit_id is not None and status != "Completed":
            connection.execute(
                update(tables["ems_unit"])
                .where(tables["ems_unit"].c.unit_id == unit_id)
                .values(unit_status=_unit_status(status))
            )
        if unit_id is not None and status == "Completed":
            _release_unit_if_unassigned(connection, unit_id, incident_id)

    return _get_incident(connection, incident_id)


def delete_emergency(connection: Connection, incident_id: int) -> bool:
    existing = _get_incident(connection, incident_id)
    if existing is None:
        return False
    connection.execute(
        update(tables["emergency_incident"])
        .where(tables["emergency_incident"].c.incident_id == incident_id)
        .values(incident_status="Cancelled")
    )
    connection.execute(
        update(tables["dispatch"])
        .where(
            tables["dispatch"].c.incident_id == incident_id,
            tables["dispatch"].c.dispatch_status != "Completed",
        )
        .values(dispatch_status="Cancelled")
    )
    latest_dispatch = connection.execute(
        select(tables["dispatch"].c.unit_id)
        .where(tables["dispatch"].c.incident_id == incident_id)
        .order_by(tables["dispatch"].c.dispatch_id.desc())
        .limit(1)
    ).first()
    _release_unit_if_unassigned(
        connection,
        latest_dispatch.unit_id if latest_dispatch else None,
        incident_id,
    )
    return True


def _vehicle_rows(connection: Connection) -> list[dict]:
    unit = tables["ems_unit"]
    hospital = tables["hospital"]
    profile = tables["api_unit_profile"]
    statement = (
        select(
            unit.c.unit_id,
            unit.c.unit_number,
            unit.c.unit_status,
            unit.c.current_latitude,
            unit.c.current_longitude,
            hospital.c.city,
            hospital.c.state_code,
            profile.c.location_label,
            profile.c.crew_count,
            profile.c.notes,
            profile.c.assigned_paramedic_badge,
            profile.c.service_area,
        )
        .select_from(
            unit.join(hospital, unit.c.hospital_id == hospital.c.hospital_id)
            .outerjoin(profile, unit.c.unit_id == profile.c.unit_id)
        )
        .order_by(unit.c.unit_id)
    )
    records = _rows(connection, statement)
    for record in records:
        record["id"] = record.pop("unit_number")
        status = record.pop("unit_status")
        record["status"] = {
            "Available": "Available",
            "Dispatched": "En route",
            "En Route": "En route",
            "On Scene": "On scene",
            "Transporting Patient": "En route",
            "At Hospital": "On scene",
            "Out of Service": "Out of service",
        }[status]
        city, state_code = record.pop("city"), record.pop("state_code")
        record["location"] = record.pop("location_label") or ", ".join(
            part for part in (city, state_code) if part
        )
        record["position"] = [
            float(record.pop("current_latitude") or 35.8456),
            float(record.pop("current_longitude") or -86.3903),
        ]
        record["crew"] = record.pop("crew_count") or 0
        record["notes"] = record.pop("notes") or ""
        record["badge"] = record.pop("assigned_paramedic_badge")
        record["area"] = record.pop("service_area") or city
        record.pop("unit_id")
    return records


def list_vehicles(connection: Connection) -> list[dict]:
    return _vehicle_rows(connection)


def update_vehicle(connection: Connection, vehicle_number: str, changes: dict) -> dict | None:
    unit = tables["ems_unit"]
    record = connection.execute(
        select(unit.c.unit_id).where(unit.c.unit_number == vehicle_number)
    ).first()
    if record is None:
        return None
    unit_id = record.unit_id
    unit_changes = {}
    if "status" in changes:
        status_map = {
            "Available": "Available",
            "En route": "En Route",
            "On scene": "On Scene",
            "Out of service": "Out of Service",
        }
        unit_changes["unit_status"] = status_map[changes["status"]]
    if unit_changes:
        connection.execute(
            update(unit).where(unit.c.unit_id == unit_id).values(**unit_changes)
        )

    profile_changes = {}
    mapping = {
        "location": "location_label",
        "crew": "crew_count",
        "notes": "notes",
        "assignedParamedicBadge": "assigned_paramedic_badge",
    }
    for api_key, column in mapping.items():
        if api_key in changes:
            profile_changes[column] = changes[api_key]
    if profile_changes:
        _upsert(
            connection,
            "api_unit_profile",
            {"unit_id": unit_id, **profile_changes},
        )
    return next(
        (item for item in _vehicle_rows(connection) if item["id"] == vehicle_number),
        None,
    )


def list_hospitals(connection: Connection) -> list[dict]:
    hospital = tables["hospital"]
    hospital_resource = tables["hospital_resource"]
    resource = tables["resource"]
    bed_counts = (
        select(
            hospital_resource.c.hospital_id,
            func.sum(hospital_resource.c.available_quantity).label("available_beds"),
        )
        .select_from(
            hospital_resource.join(
                resource,
                hospital_resource.c.resource_id == resource.c.resource_id,
            )
        )
        .where(resource.c.resource_type == "Bed")
        .group_by(hospital_resource.c.hospital_id)
        .subquery()
    )
    statement = (
        select(
            hospital.c.hospital_id.label("id"),
            hospital.c.hospital_name.label("name"),
            hospital.c.city,
            hospital.c.state_code,
            hospital.c.latitude,
            hospital.c.longitude,
            bed_counts.c.available_beds,
        )
        .select_from(
            hospital.outerjoin(
                bed_counts,
                hospital.c.hospital_id == bed_counts.c.hospital_id,
            )
        )
        .order_by(hospital.c.hospital_id)
    )
    records = _rows(connection, statement)
    for record in records:
        city, state_code = record.pop("city"), record.pop("state_code")
        record["city"] = ", ".join(part for part in (city, state_code) if part)
        record["position"] = [
            float(record.pop("latitude") or 35.8456),
            float(record.pop("longitude") or -86.3903),
        ]
        record["beds"] = int(record.pop("available_beds") or 0)
        record["erWait"] = "Not recorded"
        record["area"] = city
    return records
