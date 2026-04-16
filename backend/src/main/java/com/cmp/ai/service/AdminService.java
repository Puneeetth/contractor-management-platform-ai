package com.cmp.ai.service;

import java.time.LocalDateTime;
import java.util.List;

import com.cmp.ai.dto.request.PORequest;
import com.cmp.ai.entity.PurchaseOrder;
import com.cmp.ai.repository.PurchaseOrderRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.cmp.ai.entity.User;
import com.cmp.ai.enums.Role;
import com.cmp.ai.enums.Status;
import com.cmp.ai.exception.BadRequestException;
import com.cmp.ai.exception.ResourceNotFoundException;
import com.cmp.ai.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PurchaseOrderRepository purchaseOrderRepository;

    /**
     * Get all pending users awaiting approval
     */
    public List<User> getPendingUsers() {
        return userRepository.findByStatus(Status.PENDING);
    }

    /**
     * Get pending users by role
     */
    public List<User> getPendingUsersByRole(Role role) {
        return userRepository.findByRoleAndStatus(role, Status.PENDING);
    }

    /**
     * Approve a pending user
     */
    public User approveUser(Long userId, String approvalReason, User approver) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getStatus() != Status.PENDING) {
            throw new BadRequestException("User is not in pending status");
        }

        user.setStatus(Status.APPROVED);
        user.setApprovalReason(approvalReason != null ? approvalReason : "Approved");
        user.setApprovedBy(approver);
        user.setApprovalDate(LocalDateTime.now());

        return userRepository.save(user);
    }

    /**
     * Reject a pending user
     */
    public User rejectUser(Long userId, String rejectionReason, User approver) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getStatus() != Status.PENDING) {
            throw new BadRequestException("User is not in pending status");
        }

        user.setStatus(Status.REJECTED);
        user.setApprovalReason(rejectionReason != null ? rejectionReason : "Rejected");
        user.setApprovedBy(approver);
        user.setApprovalDate(LocalDateTime.now());

        return userRepository.save(user);
    }

    /**
     * Create a new contractor (Admin only)
     */
    public User createContractor(String name, String email, String password, String region, String specialization) {
        // Validate email uniqueness
        if (userRepository.findByEmail(email).isPresent()) {
            throw new BadRequestException("Email already exists");
        }

        User contractor = User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(Role.CONTRACTOR)
                .region(region)
                .status(Status.APPROVED) // Contractors created by admin are directly approved
                .registeredDate(LocalDateTime.now())
                .build();

        return userRepository.save(contractor);
    }

    /**
     * Deactivate a user account
     */
    public User deactivateUser(Long userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setStatus(Status.INACTIVE);
        user.setApprovalReason(reason != null ? reason : "Account deactivated");

        return userRepository.save(user);
    }

    /**
     * Reactivate an inactive user
     */
    public User reactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getStatus() != Status.INACTIVE) {
            throw new BadRequestException("User is not inactive");
        }

        user.setStatus(Status.APPROVED);
        user.setApprovalDate(LocalDateTime.now());

        return userRepository.save(user);
    }

    /**
     * Get all users with pagination and filters
     */
    public List<User> getUsersByStatus(Status status) {
        return userRepository.findByStatus(status);
    }

    public List<User> getUsersByRole(Role role) {
        return userRepository.findByRole(role);
    }

    public List<User> getUsersByRoleAndStatus(Role role, Status status) {
        return userRepository.findByRoleAndStatus(role, status);
    }

}
