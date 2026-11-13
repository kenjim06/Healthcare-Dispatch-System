import unittest

from pydantic import ValidationError

from schemas import EmergencyCreate, EmergencyUpdate, VehicleUpdate


class EmergencyLocationSchemaTests(unittest.TestCase):
    def test_create_requires_a_valid_map_position(self):
        values = {
            "patientName": "Test Patient",
            "address": "123 Main Street",
            "priority": "High",
            "position": [35.8456, -86.3903],
        }

        emergency = EmergencyCreate.model_validate(values)

        self.assertEqual(emergency.position, (35.8456, -86.3903))

    def test_create_rejects_missing_or_out_of_range_position(self):
        values = {
            "patientName": "Test Patient",
            "address": "123 Main Street",
            "priority": "High",
        }

        with self.assertRaises(ValidationError):
            EmergencyCreate.model_validate(values)
        with self.assertRaises(ValidationError):
            EmergencyCreate.model_validate({**values, "position": [91, 0]})
        with self.assertRaises(ValidationError):
            EmergencyCreate.model_validate({**values, "position": [0, 181]})

    def test_update_accepts_position_without_changing_the_address(self):
        update = EmergencyUpdate.model_validate({"position": [35.9, -86.4]})

        self.assertEqual(update.position, (35.9, -86.4))


class VehicleParamedicAssignmentSchemaTests(unittest.TestCase):
    def test_vehicle_update_accepts_paramedic_badge_and_unassignment(self):
        assigned = VehicleUpdate.model_validate({"assignedParamedicBadge": "1234"})
        unassigned = VehicleUpdate.model_validate({"assignedParamedicBadge": None})

        self.assertEqual(assigned.assignedParamedicBadge, "1234")
        self.assertIsNone(unassigned.assignedParamedicBadge)

    def test_vehicle_update_limits_paramedic_badge_length(self):
        with self.assertRaises(ValidationError):
            VehicleUpdate.model_validate({"assignedParamedicBadge": "x" * 41})


if __name__ == "__main__":
    unittest.main()
