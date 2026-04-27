package com.cmp.ai.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

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
    private final FileService fileService;

    public CustomerResponse createCustomer(CustomerRequest request, MultipartFile msaFile) {
        var customer = CustomerTransformer.customerRequestToCustomer(request);
        if (msaFile != null && !msaFile.isEmpty()) {
            customer.setMsaFileUrl(fileService.uploadFile(msaFile));
        }
        customer = customerRepository.save(customer);
        auditTrailService.logSystemAction("CUSTOMER", customer.getId(), "CREATE_CUSTOMER", "Created customer", customer.getName());
        return CustomerTransformer.customerToCustomerResponse(customer);
    }

    public CustomerResponse updateCustomer(Long id, CustomerRequest request, MultipartFile msaFile) {
        var customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        customer.setName(request.getName());
        customer.setAddress(request.getAddress());
        customer.setMsa(request.getMsa());
        customer.setMsaRemark(request.getMsaRemark());
        customer.setCountriesApplicable(request.getCountriesApplicable());
        customer.setMsaContactPerson(request.getMsaContactPerson());
        customer.setMsaContactEmail(request.getMsaContactEmail());
        customer.setNoticePeriodDays(request.getNoticePeriodDays());

        if (msaFile != null && !msaFile.isEmpty()) {
            customer.setMsaFileUrl(fileService.uploadFile(msaFile));
        }

        var updatedCustomer = customerRepository.save(customer);
        auditTrailService.logSystemAction("CUSTOMER", updatedCustomer.getId(), "UPDATE_CUSTOMER", "Updated customer", updatedCustomer.getName());
        return CustomerTransformer.customerToCustomerResponse(updatedCustomer);
    }

    public List<CustomerResponse> getAllCustomers() {
        return customerRepository.findAll().stream()
                .map(CustomerTransformer::customerToCustomerResponse)
                .toList();
    }
}
