import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import URL, create_engine
from sqlalchemy.engine import Engine

load_dotenv(Path(__file__).with_name(".env"))

required_settings = ("DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD")
missing_settings = [name for name in required_settings if not os.getenv(name)]
if missing_settings:
    raise RuntimeError(
        "Missing MySQL settings in backend/.env: " + ", ".join(missing_settings)
    )

database_url = URL.create(
    drivername="mysql+pymysql",
    username=os.environ["DB_USER"],
    password=os.environ["DB_PASSWORD"],
    host=os.environ["DB_HOST"],
    port=int(os.getenv("DB_PORT", "3306")),
    database=os.environ["DB_NAME"],
)

engine: Engine = create_engine(
    database_url,
    pool_pre_ping=True,
    pool_recycle=1800,
    connect_args={"connect_timeout": 5},
)
