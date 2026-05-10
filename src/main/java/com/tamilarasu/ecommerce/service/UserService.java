package com.tamilarasu.ecommerce.service;

import com.tamilarasu.ecommerce.dto.RegistrationRequest;
import com.tamilarasu.ecommerce.dto.UserResponse;
import com.tamilarasu.ecommerce.entity.User;
import com.tamilarasu.ecommerce.exception.EmailAlreadyExistsException;
import com.tamilarasu.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCK_DURATION_MINUTES = 30;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Transactional
    public UserResponse register(RegistrationRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException(request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .phone(request.getPhone())
                .role(User.Role.CUSTOMER)
                .locked(false)
                .failedAttempts(0)
                .build();

        User saved = userRepository.save(user);
        log.info("Registered new user: {}", saved.getEmail());

        // Send welcome email asynchronously
        emailService.sendWelcomeEmail(saved.getEmail(), saved.getName());

        return toResponse(saved);
    }

    public User loadUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found: " + email));
    }

    @Transactional
    public void incrementFailedAttempts(User user) {
        int newAttempts = user.getFailedAttempts() + 1;
        user.setFailedAttempts(newAttempts);
        userRepository.save(user);
    }

    @Transactional
    public void lockUser(User user) {
        user.setLocked(true);
        user.setLockTime(LocalDateTime.now());
        userRepository.save(user);
        log.warn("Account locked for user: {}", user.getEmail());
    }

    @Transactional
    public boolean unlockIfExpired(User user) {
        if (user.getLockTime() != null &&
                user.getLockTime().plusMinutes(LOCK_DURATION_MINUTES).isBefore(LocalDateTime.now())) {
            user.setLocked(false);
            user.setFailedAttempts(0);
            user.setLockTime(null);
            userRepository.save(user);
            log.info("Account unlocked for user: {}", user.getEmail());
            return true;
        }
        return false;
    }

    @Transactional
    public void resetFailedAttempts(User user) {
        user.setFailedAttempts(0);
        userRepository.save(user);
    }

    public int getMaxFailedAttempts() {
        return MAX_FAILED_ATTEMPTS;
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public UserResponse toUserResponse(User user) {
        return toResponse(user);
    }
}
