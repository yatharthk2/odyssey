"""ChatRequest validation: defaults, enums, and tolerant extra-field handling."""

import pytest
from pydantic import ValidationError

from chat.schemas import ChatRequest


def test_defaults_applied():
    r = ChatRequest.model_validate({"question": "hi"})
    assert r.question == "hi"
    assert r.vector_store == "KG"
    assert r.query_transformation is None
    assert r.model_provider is None


def test_full_valid_request():
    r = ChatRequest.model_validate(
        {
            "question": "who are you",
            "vector_store": "vector",
            "query_transformation": "HyDE",
            "model_provider": "openai",
        }
    )
    assert (r.vector_store, r.query_transformation, r.model_provider) == (
        "vector",
        "HyDE",
        "openai",
    )


def test_empty_question_rejected():
    with pytest.raises(ValidationError):
        ChatRequest.model_validate({"question": ""})


def test_missing_question_rejected():
    with pytest.raises(ValidationError):
        ChatRequest.model_validate({})


def test_unknown_vector_store_rejected():
    with pytest.raises(ValidationError):
        ChatRequest.model_validate({"question": "hi", "vector_store": "graph"})


def test_unknown_transformation_rejected():
    with pytest.raises(ValidationError):
        ChatRequest.model_validate({"question": "hi", "query_transformation": "StepBack"})


def test_unknown_provider_rejected():
    with pytest.raises(ValidationError):
        ChatRequest.model_validate({"question": "hi", "model_provider": "anthropic"})


def test_extra_fields_ignored():
    r = ChatRequest.model_validate({"question": "hi", "junk": 123, "vector_store": "KG"})
    assert not hasattr(r, "junk")
