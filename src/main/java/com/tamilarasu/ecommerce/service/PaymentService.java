package com.tamilarasu.ecommerce.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Payment service — simulates payment gateway integration.
 * In production, replace with actual gateway (Stripe, Razorpay, etc.).
 * Card data is NEVER stored in the database.
 */
@Service
@Slf4j
public class PaymentService {

    /**
     * Process a payment using a gateway token.
     * The token is provided by the frontend after tokenizing card data with the gateway SDK.
     * We never receive or store raw card numbers.
     *
     * @param token  Payment gateway token (never a raw card number)
     * @param amount Amount to charge
     * @return true if payment succeeded, false otherwise
     */
    public boolean processPayment(String token, BigDecimal amount) {
        if (token == null || token.isBlank()) {
            log.warn("Payment failed: null or blank token");
            return false;
        }

        // Simulate payment processing
        // In production: call gateway API with token and amount
        log.info("Processing payment of {} with token: {}...", amount, token.substring(0, Math.min(8, token.length())));

        // Simulate: tokens starting with "fail_" are rejected (for testing)
        if (token.startsWith("fail_")) {
            log.warn("Payment declined for token: {}", token);
            return false;
        }

        log.info("Payment of {} processed successfully", amount);
        return true;
    }
}
