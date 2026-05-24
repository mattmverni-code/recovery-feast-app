from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

database_url = settings.database_url
connect_args = {}
if database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
elif database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_database_type() -> str:
    if database_url.startswith("sqlite"):
        return "sqlite"
    if database_url.startswith("postgresql"):
        return "postgres"
    return "unknown"


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
