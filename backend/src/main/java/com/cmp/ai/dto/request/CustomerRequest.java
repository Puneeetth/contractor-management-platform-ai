package com.cmp.ai.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String address;

    @NotBlank
    private String msa;

    private String createdDate;

    private String msaRenewalDate;
    private String msaRemark;
    private String countriesApplicable;

    @NotBlank
    private String msaContactPerson;

    @NotBlank
    @Email
    private String msaContactEmail;

    @PositiveOrZero
    private Integer noticePeriodDays;
}