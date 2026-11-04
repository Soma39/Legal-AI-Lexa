import pytest


def test_list_templates(client):
    res = client.get("/api/v1/documents/templates")
    assert res.status_code == 200
    templates = res.json()
    assert len(templates) >= 6
    codes = [t["code"] for t in templates]
    assert "residential_rental_agreement" in codes
    assert "basic_service_agreement" in codes
    assert "general_legal_notice" in codes
    assert "consumer_complaint_draft" in codes
    assert "employment_offer_letter" in codes
    assert "general_sworn_affidavit" in codes


def test_generate_rental_agreement_draft(client, user_auth_headers):
    payload = {
        "template_code": "residential_rental_agreement",
        "title": "Apartment 402 Lease Agreement",
        "input_data": {
            "landlord_name": "Arun Sharma",
            "landlord_address": "Flat 101, Indiranagar, Bangalore",
            "tenant_name": "Priya Nair",
            "tenant_address": "House 45, Koramangala, Bangalore",
            "property_address": "Flat 402, Green Glen Layout, Bellandur, Bangalore",
            "state_jurisdiction": "Karnataka",
            "monthly_rent": 35000,
            "security_deposit": 150000,
            "lease_term_months": 11,
            "commencement_date": "2026-11-01",
            "notice_period_days": 30,
            "maintenance_charge": 3000
        }
    }
    res = client.post("/api/v1/documents/drafts", headers=user_auth_headers, json=payload)
    assert res.status_code == 201
    draft = res.json()
    assert draft["title"] == "Apartment 402 Lease Agreement"
    assert "Arun Sharma" in draft["generated_content"]
    assert "Priya Nair" in draft["generated_content"]
    assert "35000" in draft["generated_content"]

    draft_id = draft["id"]

    # Test DOCX download
    docx_res = client.get(f"/api/v1/documents/drafts/{draft_id}/download/docx", headers=user_auth_headers)
    assert docx_res.status_code == 200
    assert "application/vnd.openxmlformats-officedocument.wordprocessingml.document" in docx_res.headers["content-type"]
    assert len(docx_res.content) > 1000

    # Test PDF download
    pdf_res = client.get(f"/api/v1/documents/drafts/{draft_id}/download/pdf", headers=user_auth_headers)
    assert pdf_res.status_code == 200
    assert "application/pdf" in pdf_res.headers["content-type"]
    assert len(pdf_res.content) > 1000

    # Test Update Draft
    update_res = client.put(
        f"/api/v1/documents/drafts/{draft_id}",
        headers=user_auth_headers,
        json={"title": "Updated Apartment 402 Lease"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Updated Apartment 402 Lease"

    # Test Delete Draft
    del_res = client.delete(f"/api/v1/documents/drafts/{draft_id}", headers=user_auth_headers)
    assert del_res.status_code == 204


def test_invalid_template_code_fails(client, user_auth_headers):
    res = client.post("/api/v1/documents/drafts", headers=user_auth_headers, json={
        "template_code": "non_existent_template",
        "title": "Invalid Template Test",
        "input_data": {}
    })
    assert res.status_code == 404
