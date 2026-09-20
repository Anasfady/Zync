from core.database import engine
from app.models.models import Base
from sqlalchemy import text

print("Force dropping all tables (CASCADE)...")
with engine.begin() as conn:
    conn.execute(text("DROP SCHEMA public CASCADE;"))
    conn.execute(text("CREATE SCHEMA public;"))

print("Recreating tables with the new columns...")
Base.metadata.create_all(bind=engine)

print("Database reset complete!")