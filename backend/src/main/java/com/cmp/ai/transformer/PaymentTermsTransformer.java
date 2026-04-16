package com.cmp.ai.transformer;

import com.cmp.ai.dto.request.PaymentTermsRequest;
import com.cmp.ai.dto.response.PaymentTermsResponse;
import com.cmp.ai.entity.Customer;
import com.cmp.ai.entity.PaymentTerms;

public class PaymentTermsTransformer {

    public static PaymentTermsResponse paymentTermsToResponse(PaymentTerms paymentTerms) {
        return PaymentTermsResponse.builder()
                .id(paymentTerms.getId())
                .customerId(paymentTerms.getCustomer() == null ? null : paymentTerms.getCustomer().getId())
                .terms(paymentTerms.getTerms())
                .remark(paymentTerms.getRemark())
                .build();
    }

    public static PaymentTerms paymentTermsRequestToEntity(PaymentTermsRequest request, Customer customer) {
        return new PaymentTerms(
                request.getCustomerId(),
                request.getTerms(),
                request.getRemark(),
                customer
        );
    }
}
