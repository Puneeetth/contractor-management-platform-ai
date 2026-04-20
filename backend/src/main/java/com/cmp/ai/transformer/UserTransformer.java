package com.cmp.ai.transformer;
import com.cmp.ai.dto.response.UserResponse;
import com.cmp.ai.entity.User;

public class UserTransformer {

    public static UserResponse userToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .region(user.getRegion())
                .contractorId(user.getContractorId())
                .status(user.getStatus().name())
                .registeredDate(user.getRegisteredDate())
                .approvalDate(user.getApprovalDate())
                .approvalReason(user.getApprovalReason())
                .approvedById(user.getApprovedBy() != null ? user.getApprovedBy().getId() : null)
                .approvedByName(user.getApprovedBy() != null ? user.getApprovedBy().getName() : null)
                .build();
    }

}
