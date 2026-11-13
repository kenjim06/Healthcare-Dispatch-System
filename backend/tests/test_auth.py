import os
import unittest
from unittest.mock import patch

os.environ.setdefault("DB_HOST", "127.0.0.1")
os.environ.setdefault("DB_NAME", "test_database")
os.environ.setdefault("DB_USER", "test_user")
os.environ.setdefault("DB_PASSWORD", "test_password")
os.environ["AUTH_SECRET"] = "unit-test-secret-value-with-more-than-32-characters"

import auth
from fastapi import HTTPException


class AuthenticationTests(unittest.TestCase):
    def test_password_hash_verifies_only_the_original_password(self):
        stored_hash = auth.hash_password("correct horse battery staple")

        self.assertNotEqual(stored_hash, auth.hash_password("correct horse battery staple"))
        self.assertTrue(auth.verify_password("correct horse battery staple", stored_hash))
        self.assertFalse(auth.verify_password("incorrect", stored_hash))

    def test_session_token_is_signed_and_expires(self):
        now = 1_800_000_000
        with patch("auth.time.time", return_value=now):
            token = auth.create_token("person@example.org")
        with patch("auth.time.time", return_value=now + 1):
            self.assertEqual(auth._decode_token(token), "person@example.org")
        with patch(
            "auth.time.time",
            return_value=now + auth.TOKEN_LIFETIME_SECONDS + 1,
        ):
            with self.assertRaises(HTTPException) as expired:
                auth._decode_token(token)
        self.assertEqual(expired.exception.status_code, 401)

    def test_session_token_rejects_tampering(self):
        payload, signature = auth.create_token("person@example.org").split(".")
        replacement = "A" if payload[-1] != "A" else "B"

        with self.assertRaises(HTTPException) as rejected:
            auth._decode_token(f"{payload[:-1]}{replacement}.{signature}")
        self.assertEqual(rejected.exception.status_code, 401)

    def test_role_guard_rejects_a_different_role(self):
        dispatcher_only = auth.require_roles("Dispatcher")

        with self.assertRaises(HTTPException) as rejected:
            dispatcher_only({"role": "Hospital Admin"})
        self.assertEqual(rejected.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
