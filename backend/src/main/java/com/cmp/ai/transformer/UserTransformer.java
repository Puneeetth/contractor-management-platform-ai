package com.cmp.ai.transformer;


import com.cmp.ai.dto.request.RegisterRequest;
import com.cmp.ai.dto.response.UserResponse;
import com.cmp.ai.entity.User;
import com.cmp.ai.enums.Role;

public class UserTransformer {

    public static UserResponse UserToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .region(user.getRegion())
                .status(user.getStatus().name())
                .build();
    }

    public static User UserRequestToUser(RegisterRequest req) {
        return User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(req.getPassword())
                .role(Role.valueOf(req.getRole()))
                .region(req.getRegion())
                .build();
    }
}