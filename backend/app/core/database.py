"""
FlowSense - Database Configuration
SQLAlchemy async database setup with connection pooling
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from .config import settings


class Base(DeclarativeBase):
    pass


class DatabaseManager:
    def __init__(self, database_url: str):
        if database_url.startswith("sqlite:///") and "+aiosqlite" not in database_url:
            database_url = database_url.replace("sqlite:///", "sqlite+aiosqlite:///")
        self.engine = create_async_engine(
            database_url,
            echo=False,
            future=True,
            pool_pre_ping=True
        )
        self.async_session = async_sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
    
    async def create_tables(self):
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def insert_one(self, obj):
        async with self.async_session() as session:
            session.add(obj)
            await session.commit()

    async def insert_many(self, objs):
        if not objs:
            return
        async with self.async_session() as session:
            session.add_all(objs)
            await session.commit()


db_manager = DatabaseManager(settings.DATABASE_URL)
