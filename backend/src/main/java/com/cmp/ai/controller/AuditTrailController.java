package com.cmp.ai.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cmp.ai.dto.response.AuditLogResponse;
import com.cmp.ai.dto.response.WorkflowEventResponse;
import com.cmp.ai.service.AuditTrailService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/audit")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'MANAGER')")
public class AuditTrailController {

    private final AuditTrailService auditTrailService;

    @GetMapping("/logs")
    public List<AuditLogResponse> getAuditLogs(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long entityId) {
        return auditTrailService.getAuditLogs(entityType, entityId);
    }

    @GetMapping("/workflow")
    public List<WorkflowEventResponse> getWorkflowEvents(
            @RequestParam(required = false) String workflowType,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long entityId) {
        return auditTrailService.getWorkflowEvents(workflowType, entityType, entityId);
    }
}
