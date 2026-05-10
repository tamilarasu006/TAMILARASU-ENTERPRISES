package com.tamilarasu.ecommerce.entity;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;

class UserTest {

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .email("test@example.com")
                .passwordHash("hashedPassword123")
                .name("Test User")
                .phone("1234567890")
                .role(User.Role.CUSTOMER)
                .build();
    }

    @Test
    void testUserCreation() {
        assertNotNull(user);
        assertEquals("test@example.com", user.getEmail());
        assertEquals("hashedPassword123", user.getPasswordHash());
        assertEquals("Test User", user.getName());
        assertEquals("1234567890", user.getPhone());
        assertEquals(User.Role.CUSTOMER, user.getRole());
        assertFalse(user.isLocked());
        assertEquals(0, user.getFailedAttempts());
        assertNull(user.getLockTime());
    }

    @Test
    void testDefaultValues() {
        User defaultUser = User.builder()
                .email("default@example.com")
                .passwordHash("hash")
                .name("Default User")
                .build();

        assertEquals(User.Role.CUSTOMER, defaultUser.getRole());
        assertFalse(defaultUser.isLocked());
        assertEquals(0, defaultUser.getFailedAttempts());
    }

    @Test
    void testAdminRole() {
        User adminUser = User.builder()
                .email("admin@example.com")
                .passwordHash("adminHash")
                .name("Admin User")
                .role(User.Role.ADMIN)
                .build();

        assertEquals(User.Role.ADMIN, adminUser.getRole());
    }

    @Test
    void testAccountLocking() {
        user.setLocked(true);
        user.setFailedAttempts(5);
        user.setLockTime(LocalDateTime.now());

        assertTrue(user.isLocked());
        assertEquals(5, user.getFailedAttempts());
        assertNotNull(user.getLockTime());
    }

    @Test
    void testPrePersistCallback() {
        // Simulate @PrePersist callback
        user.onCreate();
        
        assertNotNull(user.getCreatedAt());
        assertTrue(user.getCreatedAt().isBefore(LocalDateTime.now().plusSeconds(1)));
        assertTrue(user.getCreatedAt().isAfter(LocalDateTime.now().minusSeconds(1)));
    }

    @Test
    void testRequiredFields() {
        // Test that required fields are properly set
        assertNotNull(user.getEmail());
        assertNotNull(user.getPasswordHash());
        assertNotNull(user.getName());
        assertNotNull(user.getRole());
    }

    @Test
    void testOptionalFields() {
        User userWithoutPhone = User.builder()
                .email("nophone@example.com")
                .passwordHash("hash")
                .name("No Phone User")
                .build();

        assertNull(userWithoutPhone.getPhone());
        assertNull(userWithoutPhone.getLockTime());
    }
}