package com.cmp.ai.entity;

import java.time.LocalDateTime;
import java.util.List;

import com.cmp.ai.enums.Role;
import com.cmp.ai.enums.Status;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
    name = "users",
    indexes = {
        @Index(name = "idx_email", columnList = "email"),
        @Index(name = "idx_role", columnList = "role"),
        @Index(name = "idx_status", columnList = "status"),
        @Index(name = "idx_role_status", columnList = "role, status")
    }
)
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String email;
    private String secondaryEmail;
    private String address;
    private String location;
    private String phoneNumber;

    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;

    private String region;

    
    @Column(unique = true)
    private String contractorId;

    @Enumerated(EnumType.STRING)
    private Status status;

    // Approval workflow fields
    private String approvalReason;      // For approval/rejection notes
    
    @ManyToOne(fetch = FetchType.LAZY)
    private User approvedBy;            // Reference to admin who approved
    
    private LocalDateTime approvalDate; // When approved/rejected
    
    @Column(name = "registered_date", nullable = false, updatable = false)
    private LocalDateTime registeredDate; // When user registered

        
}