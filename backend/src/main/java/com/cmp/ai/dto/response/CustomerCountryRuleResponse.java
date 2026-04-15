package com.cmp.ai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerCountryRuleResponse {

    private Long id;
    private Long customerId;
    private String countryCode;
    private boolean allowed;
}
