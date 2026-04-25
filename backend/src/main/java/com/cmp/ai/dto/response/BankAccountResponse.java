package com.cmp.ai.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankAccountResponse {

    private Long id;

    private String accountHolderName;

    private String bankName;

    @JsonProperty("accountNumber")
    private String accountNumber;

    @JsonProperty("maskedAccountNumber")
    private String maskedAccountNumber;

    private String ifscCode;

    private String branch;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
