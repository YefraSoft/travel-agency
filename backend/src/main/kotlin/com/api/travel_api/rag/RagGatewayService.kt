package com.api.travel_api.rag

import com.api.travel_api.api.RagAssistantResponse
import com.api.travel_api.api.WhatsAppInboundRequest
import com.api.travel_api.common.UpstreamException
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.client.RestClient
import org.springframework.web.client.RestClientException

@Service
class RagGatewayService(
    @Value("\${rag.service.url:http://agent:3000}") ragServiceUrl: String,
    @Value("\${rag.api.key:}") private val ragApiKey: String
) {
    private val ragClient: RestClient = RestClient.builder()
        .baseUrl(ragServiceUrl.trimEnd('/'))
        .defaultHeaders { headers ->
            if (ragApiKey.isNotBlank()) {
                headers.set("X-API-Key", ragApiKey)
            }
        }
        .build()

    fun sendWhatsAppMessage(request: WhatsAppInboundRequest): RagAssistantResponse = try {
        ragClient.post()
            .uri("/chat")
            .body(request)
            .retrieve()
            .body(RagAssistantResponse::class.java)
            ?: throw UpstreamException("RAG returned an empty response")
    } catch (exc: RestClientException) {
        throw UpstreamException("RAG service is unavailable")
    }
}
