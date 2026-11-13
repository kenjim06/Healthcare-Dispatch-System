from getpass import getpass

from sqlalchemy import insert
from sqlalchemy.exc import IntegrityError

import auth
import database


def main() -> None:
    database.initialize_database()
    auth.initialize_auth_table()

    name = input("Full name: ").strip()
    email = input("Email: ").strip().lower()
    badge = input("Badge: ").strip()
    role = input("Role (Dispatcher, Lead Paramedic, Hospital Admin): ").strip()
    if role not in auth.VALID_ROLES:
        raise SystemExit("Choose one of the listed roles.")
    if not name or not email or not badge:
        raise SystemExit("Name, email, and badge are required.")

    password = input("Password (at least 12 characters): ")
    confirmation = input("Confirm password: ")
    if len(password) < 12:
        raise SystemExit("Passwords must contain at least 12 characters.")
    if password != confirmation:
        raise SystemExit("The passwords do not match.")

    try:
        with database.engine.begin() as connection:
            connection.execute(
                insert(auth.users).values(
                    email=email,
                    name=name,
                    role=role,
                    badge=badge,
                    password_hash=auth.hash_password(password),
                    is_active=1,
                )
            )
    except IntegrityError as error:
        raise SystemExit(
            "An account with that email address or badge already exists."
        ) from error
    print(f"Created {role} account for {email}.")


if __name__ == "__main__":
    main()
