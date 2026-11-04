import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.database import Base, get_db
from app.core.config import settings
from app.main import app
from app.core.security import get_password_hash
from app.models import User, UserRole, UserPrivacyPreference
from app.services.rag.vector_store import vector_store

# Use in-memory SQLite for isolated automated test runs
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Ensure vector store has verified corpus loaded for test sessions."""
    from scripts.ingest_corpus import seed_legal_corpus_and_vector_store, seed_document_templates, seed_knowledge_graph
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        seed_document_templates(db)
        seed_legal_corpus_and_vector_store(db)
        seed_knowledge_graph(db)
    finally:
        db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test function."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session):
    """Override FastAPI get_db dependency to point to isolated test session."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_user(db_session):
    """Seed a test regular user."""
    user = User(
        email="testuser@example.com",
        hashed_password=get_password_hash("Password123!"),
        full_name="Test Regular User",
        role=UserRole.USER.value,
        is_active=True,
        is_superuser=False
    )
    db_session.add(user)
    db_session.flush()
    pref = UserPrivacyPreference(user_id=user.id)
    db_session.add(pref)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def test_admin(db_session):
    """Seed a test administrator user."""
    admin = User(
        email="testadmin@example.com",
        hashed_password=get_password_hash("AdminPass123!"),
        full_name="Test Admin User",
        role=UserRole.ADMIN.value,
        is_active=True,
        is_superuser=True
    )
    db_session.add(admin)
    db_session.flush()
    pref = UserPrivacyPreference(user_id=admin.id)
    db_session.add(pref)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture(scope="function")
def user_auth_headers(client, test_user):
    """Get Authorization headers for test user."""
    res = client.post("/api/v1/auth/login", json={
        "email": "testuser@example.com",
        "password": "Password123!"
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def admin_auth_headers(client, test_admin):
    """Get Authorization headers for test admin."""
    res = client.post("/api/v1/auth/login", json={
        "email": "testadmin@example.com",
        "password": "AdminPass123!"
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
