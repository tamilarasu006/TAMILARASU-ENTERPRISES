package com.tamilarasu.ecommerce.service;

import com.tamilarasu.ecommerce.entity.Inventory;
import com.tamilarasu.ecommerce.entity.Product;
import com.tamilarasu.ecommerce.exception.InsufficientStockException;
import com.tamilarasu.ecommerce.repository.InventoryRepository;
import com.tamilarasu.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;

    /**
     * Get current stock quantity for a product
     * @param productId the product ID
     * @return current stock quantity, or 0 if no inventory record exists
     */
    @Transactional(readOnly = true)
    public int getStock(Long productId) {
        return inventoryRepository.findByProductId(productId)
                .map(Inventory::getQuantity)
                .orElse(0);
    }

    /**
     * Decrement stock quantity for a product (called on order creation)
     * @param productId the product ID
     * @param quantity the quantity to decrement
     * @throws InsufficientStockException if stock is insufficient
     */
    public void decrement(Long productId, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }

        // Use pessimistic locking to prevent race conditions during concurrent orders
        Optional<Inventory> inventoryOpt = inventoryRepository.findByProductIdWithLock(productId);
        
        if (inventoryOpt.isEmpty()) {
            throw new InsufficientStockException("No inventory record found for product ID: " + productId);
        }

        Inventory inventory = inventoryOpt.get();
        
        if (inventory.getQuantity() < quantity) {
            throw new InsufficientStockException(
                String.format("Insufficient stock for product ID %d. Available: %d, Requested: %d", 
                    productId, inventory.getQuantity(), quantity)
            );
        }

        int newQuantity = inventory.getQuantity() - quantity;
        inventory.setQuantity(newQuantity);
        
        // Mark as out of stock if quantity reaches zero
        if (newQuantity == 0) {
            inventory.setOutOfStock(true);
            log.info("Product ID {} marked as out of stock", productId);
        }

        inventoryRepository.save(inventory);
        log.info("Decremented inventory for product ID {}: {} -> {}", productId, inventory.getQuantity() + quantity, newQuantity);
    }

    /**
     * Restore stock quantity for a product (called on order cancellation)
     * @param productId the product ID
     * @param quantity the quantity to restore
     */
    public void restore(Long productId, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }

        Optional<Inventory> inventoryOpt = inventoryRepository.findByProductId(productId);
        
        if (inventoryOpt.isEmpty()) {
            // Create inventory record if it doesn't exist
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));
            
            Inventory inventory = Inventory.builder()
                    .product(product)
                    .quantity(quantity)
                    .outOfStock(false)
                    .build();
            
            inventoryRepository.save(inventory);
            log.info("Created inventory record for product ID {} with quantity {}", productId, quantity);
            return;
        }

        Inventory inventory = inventoryOpt.get();
        int oldQuantity = inventory.getQuantity();
        int newQuantity = oldQuantity + quantity;
        
        inventory.setQuantity(newQuantity);
        
        // Remove out of stock flag if quantity is restored
        if (newQuantity > 0 && inventory.isOutOfStock()) {
            inventory.setOutOfStock(false);
            log.info("Product ID {} restored from out of stock", productId);
        }

        inventoryRepository.save(inventory);
        log.info("Restored inventory for product ID {}: {} -> {}", productId, oldQuantity, newQuantity);
    }

    /**
     * Update stock quantity for a product (admin function)
     * @param productId the product ID
     * @param newQuantity the new stock quantity
     */
    public void updateStock(Long productId, int newQuantity) {
        if (newQuantity < 0) {
            throw new IllegalArgumentException("Stock quantity cannot be negative");
        }

        Optional<Inventory> inventoryOpt = inventoryRepository.findByProductId(productId);
        
        if (inventoryOpt.isEmpty()) {
            // Create inventory record if it doesn't exist
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));
            
            Inventory inventory = Inventory.builder()
                    .product(product)
                    .quantity(newQuantity)
                    .outOfStock(newQuantity == 0)
                    .build();
            
            inventoryRepository.save(inventory);
            log.info("Created inventory record for product ID {} with quantity {}", productId, newQuantity);
            return;
        }

        Inventory inventory = inventoryOpt.get();
        int oldQuantity = inventory.getQuantity();
        
        inventory.setQuantity(newQuantity);
        inventory.setOutOfStock(newQuantity == 0);

        inventoryRepository.save(inventory);
        log.info("Updated inventory for product ID {}: {} -> {}", productId, oldQuantity, newQuantity);
    }

    /**
     * Get products with low stock (quantity < 10)
     * @return list of products with low stock
     */
    @Transactional(readOnly = true)
    public List<Product> getLowStockProducts() {
        List<Inventory> lowStockInventories = inventoryRepository.findByQuantityLessThan(10);
        return lowStockInventories.stream()
                .map(Inventory::getProduct)
                .toList();
    }

    /**
     * Check if a product is out of stock
     * @param productId the product ID
     * @return true if out of stock, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean isOutOfStock(Long productId) {
        return inventoryRepository.findByProductId(productId)
                .map(Inventory::isOutOfStock)
                .orElse(true); // Consider as out of stock if no inventory record exists
    }

    /**
     * Get inventory record for a product
     * @param productId the product ID
     * @return inventory record if exists
     */
    @Transactional(readOnly = true)
    public Optional<Inventory> getInventory(Long productId) {
        return inventoryRepository.findByProductId(productId);
    }
}