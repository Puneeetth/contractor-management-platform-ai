package com.cmp.ai.dto.request;

import lombok.Data;

@Data
public class UserRequest {

    private String name;
    private String email;
    private String password;
    private String role;
    private String region;
    private String status;
}
