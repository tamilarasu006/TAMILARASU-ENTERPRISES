package com.tamilarasu.ecommerce.config;

import com.tamilarasu.ecommerce.entity.Category;
import com.tamilarasu.ecommerce.entity.User;
import com.tamilarasu.ecommerce.repository.CategoryRepository;
import com.tamilarasu.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CategoryRepository categoryRepository;

    private static final String ADMIN_EMAIL    = "tamilarasuenterprises.vsrt@gmail.com";
    private static final String ADMIN_PASSWORD = "VsRt.TE@2024";
    private static final String ADMIN_NAME     = "TAMILARASU ENTERPRISES";
    private static final String ADMIN_PHONE    = "+91 6383772487 / +91 7200048041";

    @Override
    public void run(ApplicationArguments args) {
        // Create admin account
        if (!userRepository.existsByEmail(ADMIN_EMAIL)) {
            User admin = User.builder()
                    .email(ADMIN_EMAIL)
                    .passwordHash(passwordEncoder.encode(ADMIN_PASSWORD))
                    .name(ADMIN_NAME)
                    .phone(ADMIN_PHONE)
                    .role(User.Role.ADMIN)
                    .locked(false)
                    .failedAttempts(0)
                    .build();
            userRepository.save(admin);
            log.info("✅ Admin account created: {}", ADMIN_EMAIL);
        } else {
            log.info("ℹ️  Admin account already exists: {}", ADMIN_EMAIL);
        }

        // Seed default categories
        List<Object[]> defaultCategories = List.of(
            new Object[]{"Electronics",       "electronics"},
            new Object[]{"Textiles",          "textiles"},
            new Object[]{"Machinery",         "machinery"},
            new Object[]{"Food & Beverages",  "food-beverages"},
            new Object[]{"Chemicals",         "chemicals"},
            new Object[]{"Handicrafts",       "handicrafts"},
            new Object[]{"Automotive Parts",  "automotive-parts"},
            new Object[]{"Agriculture",       "agriculture"},
            new Object[]{"Furniture",         "furniture"},
            new Object[]{"General",           "general"}
        );

        for (Object[] cat : defaultCategories) {
            String slug = (String) cat[1];
            if (categoryRepository.findBySlug(slug).isEmpty()) {
                categoryRepository.save(Category.builder()
                        .name((String) cat[0])
                        .slug(slug)
                        .build());
            }
        }
        log.info("✅ Categories seeded");
    }
}
