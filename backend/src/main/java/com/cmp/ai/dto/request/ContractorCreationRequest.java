package com.cmp.ai.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContractorCreationRequest {
    private String name;
    private String email;
    private String password;
    private String region;
    private String specialization;
    private String contractorId;
}