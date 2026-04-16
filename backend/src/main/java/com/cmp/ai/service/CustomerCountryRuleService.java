package com.cmp.ai.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.cmp.ai.dto.request.CustomerCountryRuleRequest;
import com.cmp.ai.dto.response.CustomerCountryRuleResponse;
import com.cmp.ai.entity.Country;
import com.cmp.ai.entity.Customer;
import com.cmp.ai.entity.CustomerCountryRule;
import com.cmp.ai.exception.ResourceNotFoundException;
import com.cmp.ai.repository.CountryRepository;
import com.cmp.ai.repository.CustomerCountryRuleRepository;
import com.cmp.ai.repository.CustomerRepository;
import com.cmp.ai.transformer.CustomerCountryRuleTransformer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomerCountryRuleService {

    private final CustomerCountryRuleRepository ruleRepository;
    private final CustomerRepository customerRepository;
    private final CountryRepository countryRepository;

    public CustomerCountryRuleResponse createRule(CustomerCountryRuleRequest request) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        Country country = countryRepository.findById(request.getCountryCode())
                .orElseThrow(() -> new ResourceNotFoundException("Country not found"));

        CustomerCountryRule rule = CustomerCountryRuleTransformer.customerCountryRuleRequestToEntity(request, customer, country);
        return CustomerCountryRuleTransformer.customerCountryRuleToResponse(ruleRepository.save(rule));
    }

    public CustomerCountryRuleResponse getRuleById(@NonNull Long id) {
        CustomerCountryRule rule = ruleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rule not found"));
        return CustomerCountryRuleTransformer.customerCountryRuleToResponse(rule);
    }

    public List<CustomerCountryRuleResponse> getRulesByCustomerId(@NonNull Long customerId) {
        return ruleRepository.findByCustomerId(customerId).stream()
                .map(CustomerCountryRuleTransformer::customerCountryRuleToResponse)
                .toList();
    }

    public List<CustomerCountryRuleResponse> getAllowedCountriesByCustomerId(@NonNull Long customerId) {
        return ruleRepository.findByCustomerIdAndAllowed(customerId, true).stream()
                .map(CustomerCountryRuleTransformer::customerCountryRuleToResponse)
                .toList();
    }

    public List<CustomerCountryRuleResponse> getAllRules() {
        return ruleRepository.findAll().stream()
                .map(CustomerCountryRuleTransformer::customerCountryRuleToResponse)
                .toList();
    }

    public CustomerCountryRuleResponse updateRule(@NonNull Long id, CustomerCountryRuleRequest request) {
        CustomerCountryRule rule = ruleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rule not found"));

        rule.setAllowed(request.isAllowed());
        return CustomerCountryRuleTransformer.customerCountryRuleToResponse(ruleRepository.save(rule));
    }

    public void deleteRule(@NonNull Long id) {
        if (!ruleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Rule not found");
        }
        ruleRepository.deleteById(id);
    }
}
