from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_classify_topic():
    # Test internal topic classification logic
    from main import classify_topic
    assert classify_topic("I need to check my payslip") == "PAYROLL"
    assert classify_topic("How many sick leaves do I have?") == "LEAVE"
    assert classify_topic("What is the dress code?") == "POLICY"
    assert classify_topic("Tell me about health insurance") == "BENEFITS"

def test_sensitive_keyword_detection():
    # Test sensitive query handling
    from main import is_sensitive
    assert is_sensitive("I feel I am being harassed") == True
    assert is_sensitive("I want to resign") == True
    assert is_sensitive("How many leaves do I get?") == False

def test_get_config():
    response = client.get("/config", headers={'Authorization': 'Bearer mock_token_for_testing'})
    assert response.status_code == 200
    assert "confidence_threshold" in response.json()

def test_update_config():
    response = client.post("/config", json={"confidence_threshold": 0.8}, headers={'Authorization': 'Bearer mock_token_for_testing'})
    assert response.status_code == 200
    assert response.json()["confidence_threshold"] == 0.8

def test_chat_offline_fallback():
    # Tests the chat endpoint handles requests gracefully without an API key
    response = client.post("/chat", json={
        "query": "What is the policy on remote work?",
        "employee_id": "EMP001",
        "employee_name": "John Doe"
    }, headers={'Authorization': 'Bearer mock_token_for_testing'})
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "confidence" in data
    assert data["topic"] == "POLICY"
