from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from pagume_api.portal.core.config import settings

engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI, pool_pre_ping=True, echo=False)
AsyncSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)
