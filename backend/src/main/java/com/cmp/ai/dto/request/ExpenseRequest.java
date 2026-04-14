package com.cmp.ai.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class ExpenseRequest {

    @NotNull
    @Positive
    private Double amount;

    @NotBlank
    private String description;

    @NotBlank
    private String proofUrl;
}