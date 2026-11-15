import unittest

from sqlalchemy import (
    Column,
    Integer,
    MetaData,
    String,
    Table,
    create_engine,
    insert,
    select,
)

import database


class VehicleDispatchConsistencyTests(unittest.TestCase):
    def setUp(self):
        self.metadata = MetaData()
        self.unit = Table(
            "ems_unit",
            self.metadata,
            Column("unit_id", Integer, primary_key=True),
            Column("hospital_id", Integer, nullable=False),
            Column("unit_number", String, nullable=False),
            Column("unit_status", String, nullable=False),
            Column("current_latitude", Integer),
            Column("current_longitude", Integer),
        )
        self.hospital = Table(
            "hospital",
            self.metadata,
            Column("hospital_id", Integer, primary_key=True),
            Column("city", String),
            Column("state_code", String),
        )
        self.profile = Table(
            "api_unit_profile",
            self.metadata,
            Column("unit_id", Integer, primary_key=True),
            Column("location_label", String),
            Column("crew_count", Integer),
            Column("notes", String),
            Column("assigned_paramedic_badge", String),
            Column("service_area", String),
        )
        self.dispatch = Table(
            "dispatch",
            self.metadata,
            Column("dispatch_id", Integer, primary_key=True),
            Column("unit_id", Integer, nullable=False),
            Column("dispatch_status", String, nullable=False),
        )
        self.previous_tables = {
            name: database.tables.get(name)
            for name in ("ems_unit", "hospital", "api_unit_profile", "dispatch")
        }
        database.tables.update(
            {
                "ems_unit": self.unit,
                "hospital": self.hospital,
                "api_unit_profile": self.profile,
                "dispatch": self.dispatch,
            }
        )
        self.engine = create_engine("sqlite://")
        self.metadata.create_all(self.engine)
        self.connection = self.engine.connect()
        self.connection.execute(
            insert(self.hospital).values(
                hospital_id=1,
                city="Test City",
                state_code="TS",
            )
        )
        self.connection.execute(
            insert(self.unit).values(
                unit_id=1,
                hospital_id=1,
                unit_number="UNIT-1",
                unit_status="Available",
            )
        )

    def tearDown(self):
        self.connection.close()
        self.engine.dispose()
        for name, table in self.previous_tables.items():
            if table is None:
                database.tables.pop(name, None)
            else:
                database.tables[name] = table

    def test_vehicle_list_uses_active_dispatch_status_over_available_flag(self):
        self.connection.execute(
            insert(self.dispatch).values(
                dispatch_id=1,
                unit_id=1,
                dispatch_status="Transporting",
            )
        )

        vehicle = database._vehicle_rows(self.connection)[0]

        self.assertEqual(vehicle["status"], "En route")

    def test_active_vehicle_cannot_be_marked_available(self):
        self.connection.execute(
            insert(self.dispatch).values(
                dispatch_id=1,
                unit_id=1,
                dispatch_status="Transporting",
            )
        )

        with self.assertRaisesRegex(
            database.DispatchConflictError,
            "active emergency dispatch",
        ):
            database.update_vehicle(
                self.connection,
                "UNIT-1",
                {"status": "Available"},
            )

        stored_status = self.connection.execute(
            select(self.unit.c.unit_status).where(self.unit.c.unit_id == 1)
        ).scalar_one()
        self.assertEqual(stored_status, "Available")

    def test_completed_dispatch_does_not_override_vehicle_availability(self):
        self.connection.execute(
            insert(self.dispatch).values(
                dispatch_id=1,
                unit_id=1,
                dispatch_status="Completed",
            )
        )

        vehicle = database._vehicle_rows(self.connection)[0]

        self.assertEqual(vehicle["status"], "Available")


if __name__ == "__main__":
    unittest.main()
