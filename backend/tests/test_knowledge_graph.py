import pytest


def test_get_knowledge_graph(client):
    res = client.get("/api/v1/graph")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) > 0
    assert len(data["edges"]) > 0

    # Verify BNS -> IPC repeal relation exists
    bns_edge = next((e for e in data["edges"] if e["relationship_type"] == "REPLACES"), None)
    assert bns_edge is not None
    assert "BNS" in bns_edge["description"] or "2023" in bns_edge["description"]


def test_filter_knowledge_graph_by_type(client):
    res = client.get("/api/v1/graph?entity_type=Act")
    assert res.status_code == 200
    data = res.json()
    for node in data["nodes"]:
        assert node["entity_type"] == "Act"


def test_get_entity_node_detail(client):
    res = client.get("/api/v1/graph")
    first_node_id = res.json()["nodes"][0]["id"]

    detail_res = client.get(f"/api/v1/graph/entity/{first_node_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["id"] == first_node_id
    assert "entity_name" in detail
    assert "description" in detail
