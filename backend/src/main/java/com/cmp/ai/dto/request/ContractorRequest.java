package com.cmp.ai.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContractorRequest {

    @NotNull
    private Long userId;

    @NotBlank
    private String name;

    private String address;

    private String currentLocation;

    @Email
    private String email;

    @Email
    private String secondaryEmail;

    private String phoneNumber;

    private Integer noticePeriodDays;

    private String remarks;
}
