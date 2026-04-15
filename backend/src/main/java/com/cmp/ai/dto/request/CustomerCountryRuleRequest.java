package com.cmp.ai.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerCountryRuleRequest {

    @NotNull
    private Long customerId;

    @NotNull
    private String countryCode;

    @NotNull
    private boolean allowed;
}
