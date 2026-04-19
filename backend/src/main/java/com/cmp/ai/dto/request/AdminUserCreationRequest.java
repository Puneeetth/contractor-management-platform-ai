package com.cmp.ai.dto.request;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserCreationRequest {
    private String name;
    private String email;
    private String password;
    private String role;
    private String region;
    private List<String> regions;
    private String country;
}
