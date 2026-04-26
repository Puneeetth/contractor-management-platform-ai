package com.cmp.ai.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowEventResponse {
    private Long id;
    private String entityType;
    private Long entityId;
    private String workflowType;
    private String action;
    private String resultingStatus;
    private String comment;
    private Long actorId;
    private String actorName;
    private String actorEmail;
    private String actorRole;
    private LocalDateTime createdAt;
}
