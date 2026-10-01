package com.appetite.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;

/**
 * A line of an order. Name and price are copied from the menu item at checkout, so the order keeps its
 * history when the restaurant later edits or deletes the item (menuItemId is deliberately not a foreign key).
 */
@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    private Long menuItemId;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal lineTotal;

    protected OrderItem() {
    }

    OrderItem(Order order, Long menuItemId, String name, BigDecimal unitPrice, int quantity) {
        this.order = order;
        this.menuItemId = menuItemId;
        this.name = name;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
        this.lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
    }

    public Long getId() { return id; }

    public Long getMenuItemId() { return menuItemId; }

    public String getName() { return name; }

    public BigDecimal getUnitPrice() { return unitPrice; }

    public int getQuantity() { return quantity; }

    public BigDecimal getLineTotal() { return lineTotal; }
}
