from langchain_core.messages import (
    HumanMessage,
    AIMessage,
    ToolMessage,
    SystemMessage,
)
from dto import ChatResponse, ChatMessage

def to_backend_chat_history(messages) -> list[ChatMessage]:
    result = []
    for m in messages:
        if isinstance(m, HumanMessage):
            result.append(ChatMessage(type="HUMAN", content=m.content))

        elif isinstance(m, AIMessage):
            result.append(ChatMessage(type="AI", content=m.content))

        elif isinstance(m, ToolMessage):
            result.append(ChatMessage(type="TOOL", content=m.content))

        elif isinstance(m, SystemMessage):
            result.append(ChatMessage(type="SYSTEM", content=m.content))

    return result


def to_backend_chat_history(messages) -> list[ChatMessage]:
    result = []

    for m in messages:
        if isinstance(m.__class__.__name__, str):
            pass
        if m.type == "human":
            result.append(ChatMessage(type="HUMAN", content=m.content))
        elif m.type == "ai":
            result.append(ChatMessage(type="AI", content=m.content))
        elif m.type == "tool":
            result.append(ChatMessage(type="TOOL", content=m.content))
        elif m.type == "system":
            result.append(ChatMessage(type="SYSTEM", content=m.content))

    return result
