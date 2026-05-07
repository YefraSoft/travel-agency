package com.api.travel_api.customer

import com.api.travel_api.api.CustomerRequest
import com.api.travel_api.api.CustomerResponse
import com.api.travel_api.common.ConflictException
import com.api.travel_api.common.NotFoundException
import com.api.travel_api.model.entities.Customer
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class CustomerService(private val customerRepository: CustomerRepository) {
    @Transactional(readOnly = true)
    fun list(): List<CustomerResponse> = customerRepository.findAll().map { it.toResponse() }

    @Transactional(readOnly = true)
    fun get(id: Int): CustomerResponse = findEntity(id).toResponse()

    @Transactional(readOnly = true)
    fun getByPhone(phone: String): CustomerResponse =
        (customerRepository.findByPhone(phone) ?: throw NotFoundException("Customer not found")).toResponse()

    @Transactional
    fun create(request: CustomerRequest): CustomerResponse {
        if (customerRepository.existsByPhone(request.phone)) throw ConflictException("Customer phone already exists")
        if (request.email != null && customerRepository.existsByEmail(request.email)) throw ConflictException("Customer email already exists")
        return customerRepository.save(
            Customer(
                name = request.name,
                email = request.email,
                phone = request.phone,
                birthdate = request.birthdate,
                origin = request.origin
            )
        ).toResponse()
    }

    @Transactional
    fun update(id: Int, request: CustomerRequest): CustomerResponse {
        val customer = findEntity(id)
        val byPhone = customerRepository.findByPhone(request.phone)
        if (byPhone != null && byPhone.id != id) throw ConflictException("Customer phone already exists")
        val byEmail = request.email?.let { customerRepository.findByEmail(it) }
        if (byEmail != null && byEmail.id != id) throw ConflictException("Customer email already exists")
        customer.name = request.name
        customer.email = request.email
        customer.phone = request.phone
        customer.birthdate = request.birthdate
        customer.origin = request.origin
        return customerRepository.save(customer).toResponse()
    }

    fun findEntity(id: Int): Customer =
        customerRepository.findById(id).orElseThrow { NotFoundException("Customer not found") }

    fun findByPhoneOrNull(phone: String): Customer? = customerRepository.findByPhone(phone)
}

fun Customer.toResponse() = CustomerResponse(
    id = id!!,
    name = name,
    email = email,
    phone = phone,
    birthdate = birthdate,
    origin = origin,
    createdAt = createdAt
)

