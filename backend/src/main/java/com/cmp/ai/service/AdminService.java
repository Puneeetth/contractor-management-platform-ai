package com.cmp.ai.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.cmp.ai.dto.request.ContractorCreationRequest;
import com.cmp.ai.entity.Contractor;
import com.cmp.ai.entity.User;
import com.cmp.ai.enums.Role;
import com.cmp.ai.enums.Status;
import com.cmp.ai.exception.BadRequestException;
import com.cmp.ai.exception.ResourceNotFoundException;
import com.cmp.ai.repository.ContractorRepository;
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

    private static final Set<Role> ADMIN_MANAGED_ROLES = Set.of(
            Role.FINANCE,
            Role.SALES,
            Role.HR,
            Role.GEO_MANAGER,
            Role.BDM);

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
    public User createContractor(ContractorCreationRequest request) {
        String email = request.getEmail();
        String contractorId = request.getContractorId();

        if (email == null || email.isBlank()) {
            throw new BadRequestException("Email is required");
        }

        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BadRequestException("Password is required");
        }

        if (contractorId == null || contractorId.isBlank()) {
            throw new BadRequestException("Contractor ID is required");
        }

        if (userRepository.findByEmail(email).isPresent()) {
            throw new BadRequestException("Email already exists");
        }

        if (contractorRepository.existsByContractorId(contractorId)) {
            throw new BadRequestException("Contractor ID already exists");
        }

        User user = User.builder()
                .name(request.getName())
                .email(email)
                .secondaryEmail(request.getSecondaryEmail())
                .address(request.getAddress())
                .location(request.getCurrentLocation())
                .phoneNumber(request.getPhoneNumber())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.CONTRACTOR)
                .region(request.getCurrentLocation())
                .contractorId(contractorId)
                .status(Status.APPROVED)
                .registeredDate(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(user);

        Contractor contractor = new Contractor();
        contractor.setContractorId(contractorId);
        contractor.setUser(savedUser);
        contractor.setName(request.getName());
        contractor.setAddress(request.getAddress());
        contractor.setCurrentLocation(request.getCurrentLocation());
        contractor.setEmail(email);
        contractor.setSecondaryEmail(request.getSecondaryEmail());
        contractor.setPhoneNumber(request.getPhoneNumber());
        contractor.setNoticePeriodDays(request.getNoticePeriodDays());
        contractor.setRemarks(request.getRemarks());

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
            String contractorId) {

        if (userRepository.findByEmail(email).isPresent()) {
            throw new BadRequestException("Email already exists");
        }

        Role requestedRole;
        try {
            requestedRole = Role.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid role");
        }

        if (!ADMIN_MANAGED_ROLES.contains(requestedRole)) {
            throw new BadRequestException("Invalid role");
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

        } else if (resolvedRegion == null || resolvedRegion.isBlank()) {
            throw new BadRequestException("Region is required");
        }

        User user = User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(requestedRole)
                .region(resolvedRegion)
                .location(resolvedLocation)
                .contractorId(null)
                .status(Status.APPROVED)
                .registeredDate(LocalDateTime.now())
                .build();

        return userRepository.save(user);
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
