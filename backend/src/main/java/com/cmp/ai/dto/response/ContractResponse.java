package com.cmp.ai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractResponse {

    private Long id;
    private Long contractorId;
    private String contractorName;
    private Long customerId;
    private String customerName;
    private Double billRate;
    private Double payRate;
    private String poAllocation;
    private Integer estimatedHours;
    private Double estimatedBudget;
    private String startDate;
    private String endDate;
    private Integer noticePeriodDays;
    private Boolean throughEor;
    private String remarks;
    private String terminationRemarks;
    private String status;
}
