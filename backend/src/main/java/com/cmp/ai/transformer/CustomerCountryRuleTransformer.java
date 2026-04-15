package com.cmp.ai.transformer;

import com.cmp.ai.dto.request.CustomerCountryRuleRequest;
import com.cmp.ai.dto.response.CustomerCountryRuleResponse;
import com.cmp.ai.entity.Customer;
import com.cmp.ai.entity.Country;
import com.cmp.ai.entity.CustomerCountryRule;

public class CustomerCountryRuleTransformer {

    public static CustomerCountryRuleResponse customerCountryRuleToResponse(CustomerCountryRule rule) {
        return CustomerCountryRuleResponse.builder()
                .id(rule.getId())
                .customerId(rule.getCustomer() == null ? null : rule.getCustomer().getId())
                .countryCode(rule.getCountry() == null ? null : rule.getCountry().getCode())
                .allowed(rule.isAllowed())
                .build();
    }

    public static CustomerCountryRule customerCountryRuleRequestToEntity(
            CustomerCountryRuleRequest request, 
            Customer customer, 
            Country country) {
        return new CustomerCountryRule(null, customer, country, request.isAllowed());
    }
}
