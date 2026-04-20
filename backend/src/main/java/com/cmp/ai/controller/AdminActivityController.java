package com.cmp.ai.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cmp.ai.entity.AdminActivity;
import com.cmp.ai.security.UserPrincipal;
import com.cmp.ai.service.AdminActivityService;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/admin/activities")
@RequiredArgsConstructor
@Slf4j
public class AdminActivityController {
    
    private final AdminActivityService adminActivityService;
    
    @GetMapping
    public ResponseEntity<List<AdminActivityResponse>> getRecentActivities(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(defaultValue = "10") int limit) {
        
        log.info("Fetching recent activities for admin: {}", currentUser.getId());
        
        List<AdminActivity> activities = adminActivityService.getRecentActivitiesByUser(
                currentUser.getId(), limit);
        
        List<AdminActivityResponse> response = activities.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/all")
    public ResponseEntity<List<AdminActivityResponse>> getAllRecentActivities(
            @RequestParam(defaultValue = "10") int limit) {
        
        log.info("Fetching all recent activities");
        
        List<AdminActivity> activities = adminActivityService.getRecentActivities(limit);
        
        List<AdminActivityResponse> response = activities.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }
    
    private AdminActivityResponse mapToResponse(AdminActivity activity) {
        AdminActivityResponse response = new AdminActivityResponse();
        response.setId(activity.getId());
        response.setActivityType(activity.getActivityType());
        response.setDescription(activity.getDescription());
        response.setEntityType(activity.getEntityType());
        response.setEntityId(activity.getEntityId());
        response.setEntityName(activity.getEntityName());
        response.setCreatedAt(activity.getCreatedAt());
        response.setUserName(activity.getUser() != null ? activity.getUser().getName() : "Unknown");
        
        // Determine status based on activity type
        response.setStatus(determineStatus(activity.getActivityType()));
        response.setStatusLabel(determineStatusLabel(activity.getActivityType()));
        
        return response;
    }
    
    private String determineStatus(String activityType) {
        if (activityType.contains("CREATE")) {
            return "info";
        } else if (activityType.contains("UPDATE") || activityType.contains("APPROVE")) {
            return "approved";
        } else if (activityType.contains("DELETE") || activityType.contains("REJECT")) {
            return "rejected";
        }
        return "info";
    }
    
    private String determineStatusLabel(String activityType) {
        if (activityType.contains("CREATE")) {
            return "Created";
        } else if (activityType.contains("UPDATE")) {
            return "Updated";
        } else if (activityType.contains("DELETE")) {
            return "Deleted";
        } else if (activityType.contains("APPROVE")) {
            return "Approved";
        } else if (activityType.contains("REJECT")) {
            return "Rejected";
        }
        return "Action";
    }
    
    @Data
    public static class AdminActivityResponse {
        private Long id;
        private String activityType;
        private String description;
        private String entityType;
        private Long entityId;
        private String entityName;
        private java.time.LocalDateTime createdAt;
        private String userName;
        private String status;
        private String statusLabel;
    }
}
