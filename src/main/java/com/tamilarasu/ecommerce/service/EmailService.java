package com.tamilarasu.ecommerce.service;

import com.tamilarasu.ecommerce.dto.OrderDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Async
    public void sendWelcomeEmail(String to, String name) {
        try {
            String subject = "Welcome to TAMILARASU ENTERPRISES!";
            String body = buildWelcomeEmailBody(name);
            sendHtmlEmail(to, subject, body);
        } catch (Exception e) {
            log.error("Failed to send welcome email to {}: {}", to, e.getMessage());
        }
    }

    @Async
    public void sendOrderConfirmation(String to, OrderDto order) {
        try {
            String subject = "Order Confirmation - " + order.getOrderNumber();
            String body = buildOrderConfirmationBody(order);
            sendHtmlEmail(to, subject, body);
        } catch (Exception e) {
            log.error("Failed to send order confirmation to {}: {}", to, e.getMessage());
        }
    }

    @Async
    public void sendOrderStatusUpdate(String to, String orderNumber, String newStatus) {
        try {
            String subject = "Order Status Update - " + orderNumber;
            String body = buildStatusUpdateBody(orderNumber, newStatus);
            sendHtmlEmail(to, subject, body);
        } catch (Exception e) {
            log.error("Failed to send status update email to {}: {}", to, e.getMessage());
        }
    }

    @Async
    public void sendDailyReport(List<String> adminEmails, String reportHtml) {
        for (String email : adminEmails) {
            try {
                sendHtmlEmail(email, "Daily Sales Report - TAMILARASU ENTERPRISES", reportHtml);
            } catch (Exception e) {
                log.error("Failed to send daily report to {}: {}", email, e.getMessage());
            }
        }
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);
        mailSender.send(message);
        log.info("Email sent to {} with subject: {}", to, subject);
    }

    private String buildWelcomeEmailBody(String name) {
        return """
                <html>
                <body style="font-family: Arial, sans-serif; color: #333;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #1a3c5e;">Welcome to TAMILARASU ENTERPRISES!</h1>
                    <p>Dear %s,</p>
                    <p>Thank you for registering with us. Your account has been created successfully.</p>
                    <p>You can now browse our product catalog, add items to your cart, and place orders.</p>
                    <p>If you have any questions, please contact our support team.</p>
                    <br>
                    <p>Best regards,<br>TAMILARASU ENTERPRISES Team</p>
                  </div>
                </body>
                </html>
                """.formatted(name);
    }

    private String buildOrderConfirmationBody(OrderDto order) {
        StringBuilder itemsHtml = new StringBuilder();
        if (order.getItems() != null) {
            for (var item : order.getItems()) {
                itemsHtml.append("""
                        <tr>
                          <td style="padding: 8px; border-bottom: 1px solid #eee;">%s</td>
                          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">%d</td>
                          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹%.2f</td>
                          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹%.2f</td>
                        </tr>
                        """.formatted(
                        item.getProductName(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getLineTotal()
                ));
            }
        }

        return """
                <html>
                <body style="font-family: Arial, sans-serif; color: #333;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #1a3c5e;">Order Confirmation</h1>
                    <p>Thank you for your order!</p>
                    <p><strong>Order Number:</strong> %s</p>
                    <p><strong>Status:</strong> %s</p>
                    <p><strong>Delivery Address:</strong> %s</p>
                    <table style="width: 100%%; border-collapse: collapse; margin-top: 20px;">
                      <thead>
                        <tr style="background-color: #1a3c5e; color: white;">
                          <th style="padding: 10px; text-align: left;">Product</th>
                          <th style="padding: 10px; text-align: center;">Qty</th>
                          <th style="padding: 10px; text-align: right;">Unit Price</th>
                          <th style="padding: 10px; text-align: right;">Total</th>
                        </tr>
                      </thead>
                      <tbody>%s</tbody>
                    </table>
                    <div style="margin-top: 20px; text-align: right;">
                      <p>Subtotal: ₹%.2f</p>
                      <p>Tax (18%%): ₹%.2f</p>
                      <p><strong>Total: ₹%.2f</strong></p>
                    </div>
                    <br>
                    <p>Best regards,<br>TAMILARASU ENTERPRISES Team</p>
                  </div>
                </body>
                </html>
                """.formatted(
                order.getOrderNumber(),
                order.getStatus(),
                order.getDeliveryAddress(),
                itemsHtml.toString(),
                order.getSubtotal(),
                order.getTax(),
                order.getTotal()
        );
    }

    private String buildStatusUpdateBody(String orderNumber, String newStatus) {
        return """
                <html>
                <body style="font-family: Arial, sans-serif; color: #333;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #1a3c5e;">Order Status Update</h1>
                    <p>Your order <strong>%s</strong> has been updated.</p>
                    <p><strong>New Status:</strong> %s</p>
                    <p>You can track your order by logging into your account.</p>
                    <br>
                    <p>Best regards,<br>TAMILARASU ENTERPRISES Team</p>
                  </div>
                </body>
                </html>
                """.formatted(orderNumber, newStatus);
    }
}
