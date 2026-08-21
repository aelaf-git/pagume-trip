from pagume_agents.models.agent import SupervisorDecision


def test_supervisor_decision_schema_forbids_additional_properties():
    schema = SupervisorDecision.model_json_schema()
    assert schema.get("additionalProperties") is False
    params = schema["properties"]["params"]
    assert params.get("additionalProperties") is False
    assert "properties" in params
