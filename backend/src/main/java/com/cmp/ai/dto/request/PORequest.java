package com.cmp.ai.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class PORequest {

    @NotNull
    private Long contractId;

    @NotNull
    private Long customerId;

    @NotBlank
    private String poNumber;

    @NotBlank
    private String poDate;

    @NotBlank
    private String startDate;

    @NotBlank
    private String endDate;

    @NotNull
    @PositiveOrZero
    private Double poValue;

    @NotBlank
    private String currency;

    @NotNull
    @PositiveOrZero
    private Integer paymentTermsDays;

    private String remark;

    @NotNull
    @PositiveOrZero
    private Integer numberOfResources;

    private String sharedWith;

    private Double totalHoursLimit;
}