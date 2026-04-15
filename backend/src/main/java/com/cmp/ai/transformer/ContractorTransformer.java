package com.cmp.ai.transformer;

import com.cmp.ai.dto.request.ContractorRequest;
import com.cmp.ai.dto.response.ContractorResponse;
import com.cmp.ai.entity.Contractor;
import com.cmp.ai.entity.User;

public class ContractorTransformer {

    public static ContractorResponse ContractorToContractorResponse(Contractor contractor) {
        return ContractorResponse.builder()
                .id(contractor.getId())
                .userId(contractor.getUser() == null ? null : contractor.getUser().getId())
                .name(contractor.getName())
                .address(contractor.getAddress())
                .currentLocation(contractor.getCurrentLocation())
                .email(contractor.getEmail())
                .secondaryEmail(contractor.getSecondaryEmail())
                .phoneNumber(contractor.getPhoneNumber())
                .noticePeriodDays(contractor.getNoticePeriodDays())
                .remarks(contractor.getRemarks())
                .build();
    }

    public static Contractor ContractorRequestToContractor(ContractorRequest request, User user) {
        return new Contractor(
                null,
                user,
                request.getName(),
                request.getAddress(),
                request.getCurrentLocation(),
                request.getEmail(),
                request.getSecondaryEmail(),
                request.getPhoneNumber(),
                request.getNoticePeriodDays(),
                request.getRemarks()
        );
    }
}
