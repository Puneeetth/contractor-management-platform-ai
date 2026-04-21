package com.cmp.ai.transformer;

import com.cmp.ai.dto.request.ContractorRequest;
import com.cmp.ai.dto.response.ContractorResponse;
import com.cmp.ai.entity.Contractor;
import com.cmp.ai.entity.User;

public class ContractorTransformer {

    public static ContractorResponse contractorToContractorResponse(Contractor contractor) {
        return ContractorResponse.builder()
                .id(contractor.getId())
                .userId(contractor.getUser() == null ? null : contractor.getUser().getId())
                .contractorId(contractor.getContractorId())
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

    public static Contractor contractorRequestToContractor(ContractorRequest request, User user) {
        return Contractor.builder()
                .id(null)
                .contractorId(request.getContractorId())
                .user(user)
                .name(request.getName())
                .address(request.getAddress())
                .currentLocation(request.getCurrentLocation())
                .email(request.getEmail())
                .secondaryEmail(request.getSecondaryEmail())
                .phoneNumber(request.getPhoneNumber())
                .noticePeriodDays(request.getNoticePeriodDays())
                .remarks(request.getRemarks())
                .build();
    }
}
