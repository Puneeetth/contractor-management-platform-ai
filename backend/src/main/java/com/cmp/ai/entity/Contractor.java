package com.cmp.ai.entity;

import jakarta.persistence.*;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Builder
public class Contractor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String contractorId;
    @OneToOne
    @JoinColumn(name = "user_id",nullable = false)
    private User user;


    private String name;

    private String address;

    private String currentLocation;

    private String email;

    private String secondaryEmail;

    private String phoneNumber;

    private Integer noticePeriodDays;

    private String remarks;

    private String customerManager;

    private String customerManagerEmail;
}