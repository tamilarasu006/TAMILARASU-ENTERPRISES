package com.tamilarasu.ecommerce.config;

import com.tamilarasu.ecommerce.entity.User;
import com.tamilarasu.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private static final long LOCK_DURATION_MINUTES = 30;

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        // Check if account is locked and auto-unlock if lockout period has expired
        if (user.isLocked() && user.getLockTime() != null &&
                user.getLockTime().plusMinutes(LOCK_DURATION_MINUTES).isBefore(LocalDateTime.now())) {
            user.setLocked(false);
            user.setFailedAttempts(0);
            user.setLockTime(null);
            userRepository.save(user);
            log.info("Account auto-unlocked for user: {}", email);
        }

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())))
                .accountLocked(user.isLocked())
                .build();
    }
}
