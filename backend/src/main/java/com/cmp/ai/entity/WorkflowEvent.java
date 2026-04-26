package com.cmp.ai.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
    name = "workflow_events",
    indexes = {
        @Index(name = "idx_workflow_entity", columnList = "entityType, entityId"),
        @Index(name = "idx_workflow_type", columnList = "workflowType"),
        @Index(name = "idx_workflow_created_at", columnList = "createdAt"),
        @Index(name = "idx_workflow_actor", columnList = "actor_id")
    }
)
public class WorkflowEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String entityType;

    @Column(nullable = false)
    private Long entityId;

    @Column(nullable = false, length = 80)
    private String workflowType;

    @Column(nullable = false, length = 80)
    private String action;

    @Column(nullable = false, length = 80)
    private String resultingStatus;

    @Column(length = 1000)
    private String comment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;

    @Column(length = 120)
    private String actorName;

    @Column(length = 160)
    private String actorEmail;

    @Column(length = 60)
    private String actorRole;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
