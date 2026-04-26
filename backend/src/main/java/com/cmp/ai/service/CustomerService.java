package com.cmp.ai.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.cmp.ai.dto.request.CustomerRequest;
import com.cmp.ai.dto.response.CustomerResponse;
import com.cmp.ai.repository.CustomerRepository;
import com.cmp.ai.transformer.CustomerTransformer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final AuditTrailService auditTrailService;

    public CustomerResponse createCustomer(CustomerRequest request) {
        var customer = customerRepository.save(CustomerTransformer.customerRequestToCustomer(request));
        auditTrailService.logSystemAction("CUSTOMER", customer.getId(), "CREATE_CUSTOMER", "Created customer", customer.getName());
        return CustomerTransformer.customerToCustomerResponse(customer);
    }

    public List<CustomerResponse> getAllCustomers() {
        return customerRepository.findAll().stream()
                .map(CustomerTransformer::customerToCustomerResponse)
                .toList();
    }
}
