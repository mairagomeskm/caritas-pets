import asyncio
from backend.app.services.retention import run_retention_lifecycle_job

def test_retention_job_structure():
    res = asyncio.run(run_retention_lifecycle_job(60))
    assert "success" in res
    assert "purgedConversations" in res
    assert "purgedAttachments" in res
    assert "message" in res
    assert "timestamp" in res
