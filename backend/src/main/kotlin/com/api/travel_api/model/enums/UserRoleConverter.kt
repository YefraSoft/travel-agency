package com.api.travel_api.model.enums

import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter

@Converter
class UserRoleConverter : AttributeConverter<UserRole, String> {
    override fun convertToDatabaseColumn(attribute: UserRole?): String? =
        when (attribute) {
            UserRole.IA_AGENT -> "IA-AGENT"
            null -> null
            else -> attribute.name
        }

    override fun convertToEntityAttribute(dbData: String?): UserRole? =
        when (dbData) {
            "IA-AGENT" -> UserRole.IA_AGENT
            null -> null
            else -> UserRole.valueOf(dbData)
        }
}
