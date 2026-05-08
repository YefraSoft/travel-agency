package com.api.travel_api.common

import jakarta.servlet.http.HttpServletRequest
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import java.time.Instant

open class ApiException(message: String) : RuntimeException(message)
class NotFoundException(message: String) : ApiException(message)
class ConflictException(message: String) : ApiException(message)
class BusinessException(message: String) : ApiException(message)

data class ApiError(
    val timestamp: Instant = Instant.now(),
    val status: Int,
    val error: String,
    val message: String,
    val path: String
)

@RestControllerAdvice
class ApiExceptionHandler {
    @ExceptionHandler(NotFoundException::class)
    fun notFound(ex: NotFoundException, request: HttpServletRequest) =
        error(HttpStatus.NOT_FOUND, ex.message ?: "Resource not found", request)

    @ExceptionHandler(ConflictException::class, DataIntegrityViolationException::class)
    fun conflict(ex: Exception, request: HttpServletRequest) =
        error(HttpStatus.CONFLICT, ex.message ?: "Data conflict", request)

    @ExceptionHandler(BusinessException::class)
    fun business(ex: BusinessException, request: HttpServletRequest) =
        error(HttpStatus.UNPROCESSABLE_ENTITY, ex.message ?: "Business rule violation", request)

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun validation(ex: MethodArgumentNotValidException, request: HttpServletRequest): ResponseEntity<ApiError> {
        val message = ex.bindingResult.fieldErrors
            .joinToString("; ") { "${it.field}: ${it.defaultMessage}" }
            .ifBlank { "Invalid request" }
        return error(HttpStatus.BAD_REQUEST, message, request)
    }

    private fun error(status: HttpStatus, message: String, request: HttpServletRequest): ResponseEntity<ApiError> =
        ResponseEntity.status(status).body(
            ApiError(
                status = status.value(),
                error = status.reasonPhrase,
                message = message,
                path = request.requestURI
            )
        )
}

