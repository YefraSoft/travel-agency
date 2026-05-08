package com.api.travel_api.api

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class OpenApiConfig {
    @Bean
    fun travelAgencyOpenApi(): OpenAPI = OpenAPI()
        .info(
            Info()
                .title("Travel Agency MVP API")
                .version("1.0.0")
                .description("API Spring Boot/Kotlin para frontend, RAG y n8n. MVP sin JWT.")
        )
}
