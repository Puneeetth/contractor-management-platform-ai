package com.cmp.ai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentTermsResponse {

    private Long id;
    private Long customerId;
    private String terms;
    private String remark;
}
