package com.cmp.ai.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.cmp.ai.dto.request.RegisterRequest;
import com.cmp.ai.entity.User;
import com.cmp.ai.enums.Role;
import com.cmp.ai.enums.Status;
import com.cmp.ai.exception.BadRequestException;
import com.cmp.ai.exception.ResourceNotFoundException;
import com.cmp.ai.repository.UserRepository;
import com.cmp.ai.util.JwtUtil;

import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    private final JwtUtil jwtUtil;

    public String register(RegisterRequest request) {
        // Check if email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BadRequestException("Email already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.MANAGER)
                .region(request.getRegion())
                .status(Status.PENDING)
                .registeredDate(LocalDateTime.now())
                .build();

        userRepository.save(user);

        return "User registered. Awaiting approval.";
    }

    public String login(String email, String password) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getStatus() == Status.PENDING) {
            throw new BadRequestException("Your registration is pending admin approval");
        }

        if (user.getStatus() == Status.REJECTED) {
            throw new BadRequestException("Your registration was rejected. Please contact admin");
        }

        if (user.getStatus() == Status.INACTIVE) {
            throw new BadRequestException("Your account is inactive");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password));

        return jwtUtil.generateToken(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole().name(),
                user.getStatus().name());
    }
}
