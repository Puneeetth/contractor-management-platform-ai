package com.cmp.ai.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class POResponse {

    private Long id;
    private Long contractId;
    private String poNumber;
    private String poDate;
    private String startDate;
    private String endDate;
    private Double poValue;
    private String currency;
    private Integer paymentTermsDays;
    private String remark;
    private Integer numberOfResources;
    private String sharedWith;
    private Double totalHoursLimit;
}
