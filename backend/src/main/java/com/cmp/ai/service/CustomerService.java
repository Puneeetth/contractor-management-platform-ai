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

    public CustomerResponse createCustomer(CustomerRequest request) {
        return CustomerTransformer.customerToCustomerResponse(
                customerRepository.save(CustomerTransformer.customerRequestToCustomer(request))
        );
    }

    public List<CustomerResponse> getAllCustomers() {
        return customerRepository.findAll().stream()
                .map(CustomerTransformer::customerToCustomerResponse)
                .toList();
    }
}
