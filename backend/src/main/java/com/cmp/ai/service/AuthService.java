package com.cmp.ai.service;

import org.springframework.stereotype.Service;

import com.cmp.ai.entity.User;
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

    public String register(User user) {

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setStatus(Status.PENDING);

        userRepository.save(user);

        return "User registered. Awaiting approval.";
    }

    public String login(String email, String password) {

    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    if (user.getStatus() != Status.APPROVED) {
        throw new BadRequestException("User not approved");
    }

    authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(email, password)
    );

    return jwtUtil.generateToken(email, password);
}
}