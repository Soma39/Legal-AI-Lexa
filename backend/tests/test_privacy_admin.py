import pytest


def test_privacy_preferences_update(client, user_auth_headers):
    res = client.put("/api/v1/privacy/preferences", headers=user_auth_headers, json={
        "retention_days": 60,
        "consent_personalization": False
    })
    assert res.status_code == 200
    data = res.json()
    assert data["retention_days"] == 60
    assert data["consent_personalization"] is False


def test_export_user_data(client, user_auth_headers):
    res = client.get("/api/v1/privacy/export", headers=user_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "user_profile" in data
    assert "conversations" in data
    assert "generated_documents" in data
    assert "exported_at" in data


def test_regular_user_cannot_access_admin_endpoints(client, user_auth_headers):
    res = client.get("/api/v1/admin/users", headers=user_auth_headers)
    assert res.status_code == 403
    assert "Administrative privileges required" in res.json()["detail"]


def test_admin_can_access_admin_endpoints(client, admin_auth_headers):
    res = client.get("/api/v1/admin/users", headers=admin_auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_admin_system_stats(client, admin_auth_headers):
    res = client.get("/api/v1/admin/system-stats", headers=admin_auth_headers)
    assert res.status_code == 200
    stats = res.json()
    assert "total_users" in stats
    assert "total_conversations" in stats
    assert "vector_store_chunks_count" in stats
