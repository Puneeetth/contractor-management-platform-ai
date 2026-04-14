package com.cmp.ai.dto.response;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@NoArgsConstructor
public class AuthResponse {

    private String token;

    public AuthResponse(String token) {
        this.token = token;
    }
}