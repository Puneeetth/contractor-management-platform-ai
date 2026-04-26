package com.cmp.ai.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cmp.ai.entity.WorkflowEvent;

public interface WorkflowEventRepository extends JpaRepository<WorkflowEvent, Long> {
    List<WorkflowEvent> findTop200ByOrderByCreatedAtDesc();
    List<WorkflowEvent> findByWorkflowTypeOrderByCreatedAtDesc(String workflowType);
    List<WorkflowEvent> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, Long entityId);
}
