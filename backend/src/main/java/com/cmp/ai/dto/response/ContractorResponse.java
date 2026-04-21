package com.cmp.ai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractorResponse {

    private Long id;
    private Long userId;
    private String contractorId;
    private String name;
    private String address;
    private String currentLocation;
    private String email;
    private String secondaryEmail;
    private String phoneNumber;
    private Integer noticePeriodDays;
    private String remarks;
}
