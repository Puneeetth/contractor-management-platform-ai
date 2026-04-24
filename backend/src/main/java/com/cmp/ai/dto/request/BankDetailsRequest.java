package com.cmp.ai.dto.request;

import lombok.Data;

@Data
public class BankDetailsRequest {
    private String accountHolderName;
    private String bankName;
    private String accountNumber;
    private String ifscSwift;
    private String upiId;
}
