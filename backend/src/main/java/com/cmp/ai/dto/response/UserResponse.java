package com.cmp.ai.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private String role;
    private String region;
    private String status;
    private LocalDateTime registeredDate;
    private LocalDateTime approvalDate;
    private String approvalReason;
    private Long approvedById;        // ID of approver
    private String approvedByName;    // Name of approver
}