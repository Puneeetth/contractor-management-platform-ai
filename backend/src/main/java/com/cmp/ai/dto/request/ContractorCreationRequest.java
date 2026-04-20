package com.cmp.ai.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContractorCreationRequest {
    private String contractorId;
    private String name;
    private String address;
    private String currentLocation;
    private String email;
    private String secondaryEmail;
    private String phoneNumber;
    private Integer noticePeriodDays;
    private String remarks;
    private String password;
}
