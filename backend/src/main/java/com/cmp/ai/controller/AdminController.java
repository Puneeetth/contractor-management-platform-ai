package com.cmp.ai.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cmp.ai.dto.request.ApprovalRequest;
import com.cmp.ai.dto.request.AdminUserCreationRequest;
import com.cmp.ai.dto.request.ContractorCreationRequest;
import com.cmp.ai.dto.request.RejectionRequest;
import com.cmp.ai.dto.response.UserResponse;
import com.cmp.ai.entity.User;
import com.cmp.ai.enums.Role;
import com.cmp.ai.enums.Status;
import com.cmp.ai.repository.UserRepository;
import com.cmp.ai.service.AdminService;
import com.cmp.ai.transformer.UserTransformer;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final UserRepository userRepository;

    /**
     * Get all pending users awaiting approval
     */
    @GetMapping("/users/pending")
    public ResponseEntity<List<UserResponse>> getPendingUsers() {
        List<User> pendingUsers = adminService.getPendingUsers();
        List<UserResponse> responses = pendingUsers.stream()
                .map(UserTransformer::userToUserResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * Get pending users by specific role
     */
    @GetMapping("/users/pending/role/{role}")
    public ResponseEntity<List<UserResponse>> getPendingUsersByRole(@PathVariable String role) {
        Role roleEnum = Role.valueOf(role.toUpperCase());
        List<User> pendingUsers = adminService.getPendingUsersByRole(roleEnum);
        List<UserResponse> responses = pendingUsers.stream()
                .map(UserTransformer::userToUserResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * Get all users with optional filters
     */
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String role) {
        List<User> users;

        if (status != null && role != null) {
            Status statusEnum = Status.valueOf(status.toUpperCase());
            Role roleEnum = Role.valueOf(role.toUpperCase());
            users = adminService.getUsersByRoleAndStatus(roleEnum, statusEnum);
        } else if (status != null) {
            Status statusEnum = Status.valueOf(status.toUpperCase());
            users = adminService.getUsersByStatus(statusEnum);
        } else if (role != null) {
            Role roleEnum = Role.valueOf(role.toUpperCase());
            users = adminService.getUsersByRole(roleEnum);
        } else {
            users = userRepository.findAll();
        }

        List<UserResponse> responses = users.stream()
                .map(UserTransformer::userToUserResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * Approve a pending user
     */
    @PostMapping("/users/{userId}/approve")
    public ResponseEntity<UserResponse> approveUser(
            @PathVariable Long userId,
            @RequestBody(required = false) ApprovalRequest request) {
        String approvalReason = request != null ? request.getApprovalReason() : null;
        User currentUser = getCurrentUser();
        User approvedUser = adminService.approveUser(userId, approvalReason, currentUser);
        return ResponseEntity.ok(UserTransformer.userToUserResponse(approvedUser));
    }

    /**
     * Reject a pending user
     */
    @PostMapping("/users/{userId}/reject")
    public ResponseEntity<UserResponse> rejectUser(
            @PathVariable Long userId,
            @RequestBody RejectionRequest request) {
        User currentUser = getCurrentUser();
        User rejectedUser = adminService.rejectUser(userId, request.getRejectionReason(), currentUser);
        return ResponseEntity.ok(UserTransformer.userToUserResponse(rejectedUser));
    }

    /**
     * Create a new contractor (Admin only)
     */
    @PostMapping("/contractors/create")
    public ResponseEntity<UserResponse> createContractor(@RequestBody ContractorCreationRequest request) {
        User contractor = adminService.createContractor(
                request.getName(),
                request.getEmail(),
                request.getPassword(),
                request.getRegion(),
                request.getContractorId(),
                request.getSpecialization());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(UserTransformer.userToUserResponse(contractor));
    }

    @PostMapping("/users/create")
    public ResponseEntity<UserResponse> createAdministrationUser(@RequestBody AdminUserCreationRequest request) {
        User createdUser = adminService.createAdminManagedUser(
                request.getName(),
                request.getEmail(),
                request.getPassword(),
                request.getRole(),           // ✅ correct
                request.getRegion(),         // ✅ correct
                request.getRegions(),        // ✅ correct
                request.getCountry(),        // ✅ correct
                request.getContractorId()    // ✅ LAST
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(UserTransformer.userToUserResponse(createdUser));
    }

    /**
     * Deactivate a user account
     */
    @PutMapping("/users/{userId}/deactivate")
    public ResponseEntity<UserResponse> deactivateUser(
            @PathVariable Long userId,
            @RequestParam(required = false) String reason) {
        User deactivatedUser = adminService.deactivateUser(userId, reason);
        return ResponseEntity.ok(UserTransformer.userToUserResponse(deactivatedUser));
    }

    /**
     * Reactivate an inactive user
     */
    @PutMapping("/users/{userId}/reactivate")
    public ResponseEntity<UserResponse> reactivateUser(@PathVariable Long userId) {
        User reactivatedUser = adminService.reactivateUser(userId);
        return ResponseEntity.ok(UserTransformer.userToUserResponse(reactivatedUser));
    }

    /**
     * Get user by ID
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(UserTransformer.userToUserResponse(user));
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Current user not found"));
    }
}
