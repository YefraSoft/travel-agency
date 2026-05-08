package com.api.travel_api.customer

import com.api.travel_api.api.CustomerRequest
import com.api.travel_api.api.CustomerResponse
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/admin/customers")
@Tag(name = "Admin customers")
class CustomerController(private val customerService: CustomerService) {
    @GetMapping
    fun list(): List<CustomerResponse> = customerService.list()

    @GetMapping("/{id}")
    fun get(@PathVariable id: Int): CustomerResponse = customerService.get(id)

    @GetMapping("/phone/{phone}")
    fun getByPhone(@PathVariable phone: String): CustomerResponse = customerService.getByPhone(phone)

    @PostMapping
    fun create(@Valid @RequestBody request: CustomerRequest): CustomerResponse = customerService.create(request)

    @PutMapping("/{id}")
    fun update(@PathVariable id: Int, @Valid @RequestBody request: CustomerRequest): CustomerResponse =
        customerService.update(id, request)
}

