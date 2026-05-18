package com.api.travel_api.chat

import com.api.travel_api.api.ChatMessage
import com.api.travel_api.api.ChatMessageResponse
import com.api.travel_api.model.entities.Chat
import com.api.travel_api.model.enums.UserRole
import tools.jackson.module.kotlin.jacksonObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.redis.RedisConnectionFailureException
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Service
import java.time.Duration

data class CachedChatContext(
    val id: Int,
    val phone: String,
    val customerId: Int?,
    val attendedBy: UserRole,
    val closedBy: UserRole?,
    val chatHistory: List<ChatMessage>,
    val contextSummary: String?
) {
    fun toMessageResponse() = ChatMessageResponse(
        id = id,
        customerId = customerId,
        attendedBy = attendedBy,
        closedBy = closedBy,
        chatHistory = chatHistory,
        contextSummary = contextSummary
    )
}

@Service
class ChatContextCacheService(
    private val redisTemplate: StringRedisTemplate,
    @Value("\${rag.chat.redis.ttl-hours:24}") ttlHours: Long
) {
    private val logger = LoggerFactory.getLogger(ChatContextCacheService::class.java)
    private val objectMapper = jacksonObjectMapper()
    private val ttl: Duration = Duration.ofHours(ttlHours)

    fun get(phone: String): CachedChatContext? = runRedis("get chat context") {
        val payload = redisTemplate.opsForValue().get(key(phone)) ?: return@runRedis null
        objectMapper.readValue(payload, CachedChatContext::class.java)
    }

    fun put(chat: Chat): CachedChatContext? {
        val chatId = chat.id ?: return null
        return put(
            CachedChatContext(
                id = chatId,
                phone = chat.phone,
                customerId = chat.customer?.id,
                attendedBy = chat.attendedBy,
                closedBy = chat.closedBy,
                chatHistory = chat.chatHistory,
                contextSummary = chat.contextSummary
            )
        )
    }

    fun put(context: CachedChatContext): CachedChatContext? = runRedis("put chat context") {
        redisTemplate.opsForValue().set(
            key(context.phone),
            objectMapper.writeValueAsString(context),
            ttl
        )
        context
    }

    fun append(chat: Chat, messages: List<ChatMessage>): CachedChatContext? {
        val chatId = chat.id ?: return null
        val current = get(chat.phone)
        val context = if (current != null) {
            current.copy(
                chatHistory = current.chatHistory + messages,
                contextSummary = chat.contextSummary ?: current.contextSummary,
                closedBy = chat.closedBy
            )
        } else {
            CachedChatContext(
                id = chatId,
                phone = chat.phone,
                customerId = chat.customer?.id,
                attendedBy = chat.attendedBy,
                closedBy = chat.closedBy,
                chatHistory = chat.chatHistory,
                contextSummary = chat.contextSummary
            )
        }
        return put(context)
    }

    fun delete(phone: String) {
        runRedis("delete chat context") {
            redisTemplate.delete(key(phone))
        }
    }

    private fun key(phone: String) = "rag:chat:$phone"

    private fun <T> runRedis(operation: String, block: () -> T): T? = try {
        block()
    } catch (exc: RedisConnectionFailureException) {
        logger.warn("Redis unavailable during {}. Falling back to PostgreSQL.", operation)
        null
    } catch (exc: RuntimeException) {
        logger.warn("Redis operation '{}' failed. Falling back to PostgreSQL.", operation)
        null
    }
}
