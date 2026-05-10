package com.tamilarasu.ecommerce.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tamilarasu.ecommerce.entity.User;
import com.tamilarasu.ecommerce.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.*;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.*;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
@Slf4j
public class SecurityConfig {

    private final CustomUserDetailsService customUserDetailsService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        var builder = http.getSharedObject(org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder.class);
        builder.userDetailsService(customUserDetailsService)
               .passwordEncoder(passwordEncoder());
        return builder.build();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/register", "/api/auth/login", "/api/auth/logout").permitAll()
                .requestMatchers("/api/products/**").permitAll()
                .requestMatchers("/api/categories/**").permitAll()
                .requestMatchers("/css/**", "/js/**", "/images/**", "/*.html", "/admin/*.html", "/favicon.ico").permitAll()
                .requestMatchers("/admin/products/**", "/admin/inventory/**", "/admin/orders/**", "/admin/reports/**").hasRole("ADMIN")
                .requestMatchers("/api/orders/**").authenticated()
                .requestMatchers("/api/cart/**").permitAll()
                .anyRequest().permitAll()
            )
            .formLogin(form -> form
                .loginProcessingUrl("/api/auth/login")
                .usernameParameter("email")
                .passwordParameter("password")
                .successHandler(loginSuccessHandler())
                .failureHandler(loginFailureHandler())
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .logoutSuccessHandler((req, res, auth) -> {
                    res.setStatus(HttpServletResponse.SC_OK);
                    res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    res.getWriter().write("{\"message\":\"Logged out successfully\"}");
                })
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
                .permitAll()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .maximumSessions(1)
                .expiredSessionStrategy(event -> {
                    HttpServletResponse response = event.getResponse();
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    try {
                        response.getWriter().write("{\"error\":\"Session expired\"}");
                    } catch (IOException e) {
                        log.error("Error writing session expired response", e);
                    }
                })
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, authEx) -> {
                    res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    res.getWriter().write("{\"error\":\"Authentication required\"}");
                })
                .accessDeniedHandler((req, res, accessEx) -> {
                    res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    res.getWriter().write("{\"error\":\"Access denied\"}");
                })
            )
            .headers(headers -> headers
                .frameOptions(frame -> frame.deny())
                .contentTypeOptions(ct -> {})
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000)
                )
            );

        return http.build();
    }

    private AuthenticationSuccessHandler loginSuccessHandler() {
        return (HttpServletRequest request, HttpServletResponse response, Authentication authentication) -> {
            // Reset failed attempts on successful login
            String email = authentication.getName();
            Optional<User> userOpt = userRepository.findByEmail(email);
            userOpt.ifPresent(user -> {
                if (user.getFailedAttempts() > 0) {
                    user.setFailedAttempts(0);
                    userRepository.save(user);
                }
            });

            response.setStatus(HttpServletResponse.SC_OK);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            Map<String, Object> body = Map.of(
                "message", "Login successful",
                "email", email,
                "role", authentication.getAuthorities().stream()
                    .findFirst()
                    .map(a -> a.getAuthority().replace("ROLE_", ""))
                    .orElse("CUSTOMER")
            );
            response.getWriter().write(objectMapper.writeValueAsString(body));
        };
    }

    private AuthenticationFailureHandler loginFailureHandler() {
        return (HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) -> {
            String email = request.getParameter("email");
            if (email != null && !email.isBlank()) {
                Optional<User> userOpt = userRepository.findByEmail(email);
                userOpt.ifPresent(user -> {
                    if (!user.isLocked()) {
                        int newAttempts = user.getFailedAttempts() + 1;
                        user.setFailedAttempts(newAttempts);
                        if (newAttempts >= 5) {
                            user.setLocked(true);
                            user.setLockTime(LocalDateTime.now());
                            log.warn("Account locked after {} failed attempts: {}", newAttempts, email);
                        }
                        userRepository.save(user);
                    }
                });
            }

            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            String message;
            if (exception instanceof LockedException) {
                message = "Account is locked. Please try again after 30 minutes.";
                response.setStatus(423);
            } else {
                message = "Invalid email or password";
            }
            try {
                response.getWriter().write(objectMapper.writeValueAsString(Map.of("error", message)));
            } catch (IOException e) {
                log.error("Error writing auth failure response", e);
            }
        };
    }
}
