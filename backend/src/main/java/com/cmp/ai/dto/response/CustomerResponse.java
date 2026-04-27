package com.cmp.ai.dto.response;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerResponse {

    private Long id;
    private String name;
    private String address;
    private String msa;
    private String createdDate;
    private String msaRenewalDate;
    @Size(max = 500)
    private String msaRemark;
    private String countriesApplicable;
    private String msaContactPerson;
    private String msaContactEmail;
    private Integer noticePeriodDays;
    private String msaFileUrl;
}