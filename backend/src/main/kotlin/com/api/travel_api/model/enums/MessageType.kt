package com.api.travel_api.model.enums

import com.fasterxml.jackson.annotation.JsonCreator

enum class MessageType {
    SYSTEM,
    HUMAN,
    AI,
    TOOL,
    FUNCTION;

    companion object {
        @JvmStatic
        @JsonCreator
        fun fromValue(value: String): MessageType = valueOf(value.uppercase())
    }
}
