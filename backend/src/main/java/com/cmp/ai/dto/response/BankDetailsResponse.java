package com.cmp.ai.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BankDetailsResponse {
    private Long id;
    private Long userId;
    private String accountHolderName;
    private String bankName;
    private String accountNumber;
    private String ifscSwift;
    private String upiId;
}
