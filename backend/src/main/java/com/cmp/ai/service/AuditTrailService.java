package com.cmp.ai.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cmp.ai.dto.response.AuditLogResponse;
import com.cmp.ai.dto.response.WorkflowEventResponse;
import com.cmp.ai.entity.AuditLog;
import com.cmp.ai.entity.User;
import com.cmp.ai.entity.WorkflowEvent;
import com.cmp.ai.repository.AuditLogRepository;
import com.cmp.ai.repository.WorkflowEventRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuditTrailService {

    private final AuditLogRepository auditLogRepository;
    private final WorkflowEventRepository workflowEventRepository;
    private final CurrentUserService currentUserService;

    @Transactional
    public void logSystemAction(String entityType, Long entityId, String action, String description, String details) {
        User actor = currentUserService.getCurrentUser().orElse(null);
        auditLogRepository.save(
                AuditLog.builder()
                        .entityType(entityType)
                        .entityId(entityId)
                        .action(action)
                        .description(description)
                        .details(details)
                        .actor(actor)
                        .actorName(actor != null ? actor.getName() : "System")
                        .actorEmail(actor != null ? actor.getEmail() : null)
                        .actorRole(actor != null && actor.getRole() != null ? actor.getRole().name() : "SYSTEM")
                        .createdAt(LocalDateTime.now())
                        .build()
        );
    }

    @Transactional
    public void logWorkflowAction(String entityType, Long entityId, String workflowType, String action, String resultingStatus, String comment) {
        User actor = currentUserService.getCurrentUser().orElse(null);
        workflowEventRepository.save(
                WorkflowEvent.builder()
                        .entityType(entityType)
                        .entityId(entityId)
                        .workflowType(workflowType)
                        .action(action)
                        .resultingStatus(resultingStatus)
                        .comment(comment)
                        .actor(actor)
                        .actorName(actor != null ? actor.getName() : "System")
                        .actorEmail(actor != null ? actor.getEmail() : null)
                        .actorRole(actor != null && actor.getRole() != null ? actor.getRole().name() : "SYSTEM")
                        .createdAt(LocalDateTime.now())
                        .build()
        );
    }

    public List<AuditLogResponse> getAuditLogs(String entityType, Long entityId) {
        List<AuditLog> logs;
        if (entityType != null && !entityType.isBlank() && entityId != null) {
            logs = auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType.trim(), entityId);
        } else if (entityType != null && !entityType.isBlank()) {
            logs = auditLogRepository.findByEntityTypeOrderByCreatedAtDesc(entityType.trim());
        } else {
            logs = auditLogRepository.findTop200ByOrderByCreatedAtDesc();
        }
        return logs.stream().map(this::toAuditLogResponse).toList();
    }

    public List<WorkflowEventResponse> getWorkflowEvents(String workflowType, String entityType, Long entityId) {
        List<WorkflowEvent> events;
        if (entityType != null && !entityType.isBlank() && entityId != null) {
            events = workflowEventRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType.trim(), entityId);
        } else if (workflowType != null && !workflowType.isBlank()) {
            events = workflowEventRepository.findByWorkflowTypeOrderByCreatedAtDesc(workflowType.trim());
        } else {
            events = workflowEventRepository.findTop200ByOrderByCreatedAtDesc();
        }
        return events.stream().map(this::toWorkflowEventResponse).toList();
    }

    private AuditLogResponse toAuditLogResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .action(log.getAction())
                .description(log.getDescription())
                .details(log.getDetails())
                .actorId(log.getActor() != null ? log.getActor().getId() : null)
                .actorName(log.getActorName())
                .actorEmail(log.getActorEmail())
                .actorRole(log.getActorRole())
                .createdAt(log.getCreatedAt())
                .build();
    }

    private WorkflowEventResponse toWorkflowEventResponse(WorkflowEvent event) {
        return WorkflowEventResponse.builder()
                .id(event.getId())
                .entityType(event.getEntityType())
                .entityId(event.getEntityId())
                .workflowType(event.getWorkflowType())
                .action(event.getAction())
                .resultingStatus(event.getResultingStatus())
                .comment(event.getComment())
                .actorId(event.getActor() != null ? event.getActor().getId() : null)
                .actorName(event.getActorName())
                .actorEmail(event.getActorEmail())
                .actorRole(event.getActorRole())
                .createdAt(event.getCreatedAt())
                .build();
    }
}
