package com.appetite.order;

import com.appetite.restaurant.PaymentMethod;
import com.appetite.restaurant.Restaurant;
import com.appetite.restaurant.ServiceOption;
import com.appetite.user.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders", indexes = {
        @Index(name = "idx_orders_customer", columnList = "customer_id"),
        @Index(name = "idx_orders_restaurant", columnList = "restaurant_id")
})
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Optimistic lock: a client cancelling while the restaurant accepts must not both succeed. */
    @Version
    private Long version;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private OrderStatus status = OrderStatus.PLACED;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private ServiceOption serviceOption;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 30)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private PaymentStatus paymentStatus;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;

    @Column(length = 200)
    private String deliveryAddress;

    @Column(length = 20)
    private String contactPhone;

    @Column(length = 300)
    private String note;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id")
    @BatchSize(size = 50)
    private List<OrderItem> items = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected Order() {
    }

    public Order(User customer, Restaurant restaurant, ServiceOption serviceOption, PaymentMethod paymentMethod) {
        this.customer = customer;
        this.restaurant = restaurant;
        this.serviceOption = serviceOption;
        this.paymentMethod = paymentMethod;
        this.currency = restaurant.getCurrency();
        this.paymentStatus = paymentMethod.isOnline() ? PaymentStatus.PAID : PaymentStatus.PENDING;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public void addItem(Long menuItemId, String name, BigDecimal unitPrice, int quantity) {
        OrderItem item = new OrderItem(this, menuItemId, name, unitPrice, quantity);
        items.add(item);
        total = total.add(item.getLineTotal());
    }

    /** Applies a status change and keeps the payment status consistent with it. */
    public void moveTo(OrderStatus next) {
        status = next;
        if (next == OrderStatus.COMPLETED && paymentStatus == PaymentStatus.PENDING) {
            paymentStatus = PaymentStatus.PAID;
        } else if (next == OrderStatus.CANCELLED && paymentStatus == PaymentStatus.PAID) {
            paymentStatus = PaymentStatus.REFUNDED;
        }
    }

    public Long getId() { return id; }

    public User getCustomer() { return customer; }

    public Restaurant getRestaurant() { return restaurant; }

    public OrderStatus getStatus() { return status; }

    public ServiceOption getServiceOption() { return serviceOption; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }

    public PaymentStatus getPaymentStatus() { return paymentStatus; }

    public String getCurrency() { return currency; }

    public BigDecimal getTotal() { return total; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public List<OrderItem> getItems() { return items; }

    public Instant getCreatedAt() { return createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
}
