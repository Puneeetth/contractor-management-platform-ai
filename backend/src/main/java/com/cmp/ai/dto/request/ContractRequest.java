package com.cmp.ai.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContractRequest {

    @NotNull
    private Long contractorId;

    private Long customerId;

    @NotNull
    @PositiveOrZero
    private Double billRate;

    @NotNull
    @PositiveOrZero
    private Double payRate;

    private String poAllocation;

    @NotNull
    @PositiveOrZero
    private Integer estimatedHours;

    @NotNull
    @PositiveOrZero
    private Double estimatedBudget;

    @NotBlank
    private String startDate;

    @NotBlank
    private String endDate;

    @NotNull
    @PositiveOrZero
    private Integer noticePeriodDays;

    private Boolean throughEor;
    private String remarks;
    private String terminationRemarks;
}
