package com.tamilarasu.ecommerce.repository;

import com.tamilarasu.ecommerce.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.TestPropertySource;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@TestPropertySource(locations = "classpath:application-test.properties")
class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .email("test@example.com")
                .passwordHash("hashedPassword123")
                .name("Test User")
                .phone("1234567890")
                .role(User.Role.CUSTOMER)
                .build();
    }

    @Test
    void testSaveAndFindById() {
        // Save user
        User savedUser = entityManager.persistAndFlush(testUser);
        
        // Find by ID
        Optional<User> foundUser = userRepository.findById(savedUser.getId());
        
        assertTrue(foundUser.isPresent());
        assertEquals(testUser.getEmail(), foundUser.get().getEmail());
        assertEquals(testUser.getName(), foundUser.get().getName());
        assertNotNull(foundUser.get().getCreatedAt());
    }

    @Test
    void testFindByEmail() {
        // Save user
        entityManager.persistAndFlush(testUser);
        
        // Find by email
        Optional<User> foundUser = userRepository.findByEmail("test@example.com");
        
        assertTrue(foundUser.isPresent());
        assertEquals(testUser.getEmail(), foundUser.get().getEmail());
        assertEquals(testUser.getName(), foundUser.get().getName());
    }

    @Test
    void testFindByEmailNotFound() {
        Optional<User> foundUser = userRepository.findByEmail("nonexistent@example.com");
        
        assertFalse(foundUser.isPresent());
    }

    @Test
    void testExistsByEmail() {
        // Save user
        entityManager.persistAndFlush(testUser);
        
        // Check existence
        assertTrue(userRepository.existsByEmail("test@example.com"));
        assertFalse(userRepository.existsByEmail("nonexistent@example.com"));
    }

    @Test
    void testUniqueEmailConstraint() {
        // Save first user
        entityManager.persistAndFlush(testUser);
        
        // Try to save another user with same email
        User duplicateUser = User.builder()
                .email("test@example.com") // Same email
                .passwordHash("differentHash")
                .name("Different User")
                .build();
        
        // This should throw an exception due to unique constraint
        assertThrows(Exception.class, () -> {
            entityManager.persistAndFlush(duplicateUser);
        });
    }

    @Test
    void testSaveUserWithAllFields() {
        User fullUser = User.builder()
                .email("full@example.com")
                .passwordHash("hashedPassword")
                .name("Full User")
                .phone("9876543210")
                .role(User.Role.ADMIN)
                .locked(true)
                .failedAttempts(3)
                .build();
        
        User savedUser = entityManager.persistAndFlush(fullUser);
        
        assertNotNull(savedUser.getId());
        assertEquals("full@example.com", savedUser.getEmail());
        assertEquals("Full User", savedUser.getName());
        assertEquals("9876543210", savedUser.getPhone());
        assertEquals(User.Role.ADMIN, savedUser.getRole());
        assertTrue(savedUser.isLocked());
        assertEquals(3, savedUser.getFailedAttempts());
        assertNotNull(savedUser.getCreatedAt());
    }

    @Test
    void testDefaultValues() {
        User minimalUser = User.builder()
                .email("minimal@example.com")
                .passwordHash("hash")
                .name("Minimal User")
                .build();
        
        User savedUser = entityManager.persistAndFlush(minimalUser);
        
        assertEquals(User.Role.CUSTOMER, savedUser.getRole());
        assertFalse(savedUser.isLocked());
        assertEquals(0, savedUser.getFailedAttempts());
        assertNull(savedUser.getPhone());
        assertNull(savedUser.getLockTime());
    }
}