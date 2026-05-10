package com.tamilarasu.ecommerce.service;

import com.tamilarasu.ecommerce.dto.RegistrationRequest;
import com.tamilarasu.ecommerce.dto.UserResponse;
import com.tamilarasu.ecommerce.entity.User;
import com.tamilarasu.ecommerce.exception.EmailAlreadyExistsException;
import com.tamilarasu.ecommerce.repository.UserRepository;
import net.jqwik.api.*;
import net.jqwik.api.lifecycle.BeforeTry;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Objects;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

// Feature: tamilarasu-enterprises-ecommerce, Property 2: Duplicate email registration is rejected
class UserServiceProperties {

    private UserRepository userRepository;
    private EmailService emailService;
    private PasswordEncoder passwordEncoder;
    private UserService userService;

    @BeforeTry
    void setUp() {
        userRepository = mock(UserRepository.class);
        emailService = mock(EmailService.class);
        passwordEncoder = new BCryptPasswordEncoder();
        userService = new UserService(userRepository, passwordEncoder, emailService);
    }

    @Property(tries = 100)
    @Label("Property 2: Duplicate email registration is rejected")
    void duplicateEmailRegistrationIsRejected(@ForAll("validRegistrationRequest") RegistrationRequest request) {
        // Given: An email that already exists in the system
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        // When: A second registration attempt with that email is made
        // Then: It should return an error and leave the user count unchanged
        assertThatThrownBy(() -> userService.register(request))
                .isInstanceOf(EmailAlreadyExistsException.class)
                .hasMessageContaining("Email already registered: " + request.getEmail());

        // Verify no user was saved (no state change)
        verify(userRepository, never()).save(any(User.class));
        verify(emailService, never()).sendWelcomeEmail(anyString(), anyString());
    }

    @Property(tries = 100)
    @Label("Property 1: Registration round-trip creates account and queues welcome email")
    void registrationRoundTripCreatesAccountAndQueuesWelcomeEmail(@ForAll("validRegistrationRequest") RegistrationRequest request) {
        // Given: A unique email (not already in system)
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        
        // Mock the saved user
        User savedUser = User.builder()
                .id(1L)
                .email(request.getEmail())
                .passwordHash("hashed_password")
                .name(request.getName())
                .phone(request.getPhone())
                .role(User.Role.CUSTOMER)
                .locked(false)
                .failedAttempts(0)
                .build();
        
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        // When: Valid registration data is submitted
        UserResponse response = userService.register(request);

        // Then: A new user record should exist and welcome email should be queued
        assertThat(response).isNotNull();
        assertThat(response.getEmail()).isEqualTo(request.getEmail());
        assertThat(response.getName()).isEqualTo(request.getName());
        assertThat(response.getPhone()).isEqualTo(request.getPhone());
        assertThat(response.getRole()).isEqualTo("CUSTOMER");

        // Verify user was saved with hashed password
        verify(userRepository).save(argThat(user -> 
            user.getEmail().equals(request.getEmail()) &&
            user.getName().equals(request.getName()) &&
            Objects.equals(user.getPhone(), request.getPhone()) && // Handle null phone
            user.getRole() == User.Role.CUSTOMER &&
            !user.isLocked() &&
            user.getFailedAttempts() == 0 &&
            !user.getPasswordHash().equals(request.getPassword()) // Password should be hashed
        ));

        // Verify welcome email was queued
        verify(emailService).sendWelcomeEmail(request.getEmail(), request.getName());
    }

    @Property(tries = 100)
    @Label("Property 3: Passwords are never stored in plaintext")
    void passwordsAreNeverStoredInPlaintext(@ForAll("validRegistrationRequest") RegistrationRequest request) {
        // Given: A unique email
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        
        User savedUser = User.builder()
                .id(1L)
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .phone(request.getPhone())
                .role(User.Role.CUSTOMER)
                .locked(false)
                .failedAttempts(0)
                .build();
        
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        // When: Registration is performed
        userService.register(request);

        // Then: The stored hash should differ from plaintext and be verifiable via BCrypt
        verify(userRepository).save(argThat(user -> {
            String storedHash = user.getPasswordHash();
            return !storedHash.equals(request.getPassword()) && // Not plaintext
                   passwordEncoder.matches(request.getPassword(), storedHash); // BCrypt verifiable
        }));
    }

    @Provide
    Arbitrary<RegistrationRequest> validRegistrationRequest() {
        return Combinators.combine(
                validEmail(),
                validPassword(),
                validName(),
                validPhone()
        ).as(RegistrationRequest::new);
    }

    @Provide
    Arbitrary<String> validEmail() {
        return Combinators.combine(
                Arbitraries.strings().alpha().ofMinLength(3).ofMaxLength(10),
                Arbitraries.of("gmail.com", "yahoo.com", "hotmail.com", "company.com", "test.org")
        ).as((local, domain) -> local + "@" + domain);
    }

    @Provide
    Arbitrary<String> validPassword() {
        return Combinators.combine(
                Arbitraries.strings().withChars('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h').ofMinLength(4).ofMaxLength(8),
                Arbitraries.strings().numeric().ofMinLength(2).ofMaxLength(4)
        ).as((letters, numbers) -> letters + numbers + "X1"); // Ensure min 8 chars with letters and numbers
    }

    @Provide
    Arbitrary<String> validName() {
        return Arbitraries.strings()
                .withChars("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ")
                .ofMinLength(2)
                .ofMaxLength(50)
                .filter(s -> !s.trim().isEmpty());
    }

    @Provide
    Arbitrary<String> validPhone() {
        return Arbitraries.oneOf(
                Arbitraries.just(null), // Phone is optional
                Arbitraries.strings().numeric().ofMinLength(10).ofMaxLength(15)
        );
    }
}