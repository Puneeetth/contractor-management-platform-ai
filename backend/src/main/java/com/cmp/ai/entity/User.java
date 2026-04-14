package com.cmp.ai.entity;

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
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
    name = "users",
    indexes = {
        @Index(name = "idx_email", columnList = "email"),
        @Index(name = "idx_role", columnList = "role")
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

    @Enumerated(EnumType.STRING)
    private Status status;

    @OneToMany(mappedBy = "contractor", fetch = FetchType.LAZY)
    private List<Contract> contracts;

}