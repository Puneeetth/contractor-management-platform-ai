package com.cmp.ai.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.cmp.ai.entity.Contractor;
import com.cmp.ai.repository.ContractorRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.cmp.ai.entity.User;
import com.cmp.ai.enums.Role;
import com.cmp.ai.enums.Status;
import com.cmp.ai.exception.BadRequestException;
import com.cmp.ai.exception.ResourceNotFoundException;
import com.cmp.ai.repository.CountryRepository;
import com.cmp.ai.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final ContractorRepository contractorRepository;
    private final UserRepository userRepository;
    private final CountryRepository countryRepository;
    private final PasswordEncoder passwordEncoder;
    private static final Set<Role> ADMIN_MANAGED_ROLES = Set.of(Role.FINANCE, Role.SALES, Role.HR, Role.GEO_MANAGER, Role.BDM, Role.CONTRACTOR);

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
    public User createContractor(String name, String email, String password, String region, String specialization, String contractorId) {

        if (email == null || email.isBlank()) {
            throw new BadRequestException("Email is required");
        }

        if (contractorId == null || contractorId.isBlank()) {
            throw new BadRequestException("Contractor ID is required");
        }

        if (userRepository.findByEmail(email).isPresent()) {
            throw new BadRequestException("Email already exists");
        }

        // ✅ Correct uniqueness check (Contractor table only)
        if (contractorRepository.existsByContractorId(contractorId)) {
            throw new BadRequestException("Contractor ID already exists");
        }

        // ✅ Create User
        User user = User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(Role.CONTRACTOR)
                .region(region)
                .contractorId(contractorId)
                .status(Status.APPROVED)
                .registeredDate(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(user);

        // ✅ Create Contractor
        Contractor contractor = new Contractor();
        contractor.setContractorId(contractorId);
        contractor.setUser(savedUser);
        contractor.setName(name);
        contractor.setEmail(email);
        contractor.setCurrentLocation(region);

        contractorRepository.save(contractor);

        return savedUser;
    }

    public User createAdminManagedUser(
            String name,
            String email,
            String password,
            String role,
            String region,
            List<String> regions,
            String country,
            String contractorId
    ) {

        if (userRepository.findByEmail(email).isPresent()) {
            throw new BadRequestException("Email already exists");
        }

        // ✅ Parse role FIRST
        Role requestedRole;
        try {
            requestedRole = Role.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid role");
        }

        if (!ADMIN_MANAGED_ROLES.contains(requestedRole)) {
            throw new BadRequestException("Invalid role");
        }

        // ✅ Contractor validation
        if (requestedRole == Role.CONTRACTOR) {
            if (contractorId == null || contractorId.isBlank()) {
                throw new BadRequestException("Contractor ID is required");
            }

            if (contractorRepository.existsByContractorId(contractorId)) {
                throw new BadRequestException("Contractor ID already exists");
            }
        }

        String resolvedRegion = region;
        String resolvedLocation = null;

        if (requestedRole == Role.GEO_MANAGER) {
            if (regions == null || regions.isEmpty()) {
                throw new BadRequestException("At least one region is required for GEO Manager");
            }

            resolvedRegion = regions.stream()
                    .filter(value -> value != null && !value.isBlank())
                    .map(String::trim)
                    .distinct()
                    .collect(Collectors.joining(", "));

            if (resolvedRegion.isBlank()) {
                throw new BadRequestException("At least one region is required for GEO Manager");
            }

        } else if (requestedRole == Role.BDM) {
            if (country == null || country.isBlank()) {
                throw new BadRequestException("Country is required for BDM");
            }

            var matchedCountry = countryRepository.findById(country.trim())
                    .orElseThrow(() -> new BadRequestException("Selected country is invalid"));

            resolvedLocation = matchedCountry.getCode();
            resolvedRegion = matchedCountry.getName();

        } else if (requestedRole != Role.CONTRACTOR && (resolvedRegion == null || resolvedRegion.isBlank())) {
            throw new BadRequestException("Region is required");
        }

        // ✅ Create User
        User user = User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(requestedRole)
                .region(resolvedRegion)
                .location(resolvedLocation)
                .contractorId(requestedRole == Role.CONTRACTOR ? contractorId : null)
                .status(Status.APPROVED)
                .registeredDate(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(user);

        // ✅ Create Contractor ONLY if role is CONTRACTOR
        if (requestedRole == Role.CONTRACTOR) {
            Contractor contractor = new Contractor();
            contractor.setContractorId(contractorId);
            contractor.setUser(savedUser);
            contractor.setName(name);
            contractor.setEmail(email);
            contractor.setCurrentLocation(region);

            contractorRepository.save(contractor);
        }

        return savedUser;
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
