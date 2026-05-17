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
    @Value("\${rag.service.url:http://127.0.0.1:3000/api}") ragServiceUrl: String
) {
    private val ragClient: RestClient = RestClient.builder()
        .baseUrl(ragServiceUrl.trimEnd('/'))
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
