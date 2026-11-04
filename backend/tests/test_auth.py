import pytest


def test_register_success(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "newuser@example.com",
        "password": "SecurePassword123!",
        "full_name": "New Registered User"
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["email"] == "newuser@example.com"
    assert data["role"] in ["user", "admin"]


def test_register_duplicate_email_fails(client, test_user):
    res = client.post("/api/v1/auth/register", json={
        "email": test_user.email,
        "password": "Password123!",
        "full_name": "Duplicate User"
    })
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]


def test_login_success(client, test_user):
    res = client.post("/api/v1/auth/login", json={
        "email": "testuser@example.com",
        "password": "Password123!"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user_id"] == test_user.id


def test_login_invalid_password(client, test_user):
    res = client.post("/api/v1/auth/login", json={
        "email": "testuser@example.com",
        "password": "WrongPassword!"
    })
    assert res.status_code == 401


def test_get_current_user_profile(client, user_auth_headers, test_user):
    res = client.get("/api/v1/auth/me", headers=user_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == test_user.id
    assert data["email"] == test_user.email


def test_change_password(client, user_auth_headers):
    res = client.post("/api/v1/auth/change-password", headers=user_auth_headers, json={
        "current_password": "Password123!",
        "new_password": "NewUpdatedPassword123!"
    })
    assert res.status_code == 200

    # Verify login with new password
    login_res = client.post("/api/v1/auth/login", json={
        "email": "testuser@example.com",
        "password": "NewUpdatedPassword123!"
    })
    assert login_res.status_code == 200
