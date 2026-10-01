package com.appetite.restaurant;

import com.appetite.user.User;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "restaurants")
public class Restaurant {

    public static final String DEFAULT_CURRENCY = "EUR";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(length = 60)
    private String cuisine;

    @Column(length = 200)
    private String address;

    @Column(length = 20)
    private String phone;

    // Nullable so the column can be added to existing rows; getCurrency() falls back to the default.
    @Column(length = 3)
    private String currency;

    @Column(length = 120)
    private String openingHours;

    /** Timestamp of the last logo upload, used to version the logo URL; null when there is no logo. */
    private Long logoVersion;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "restaurant_payment_methods", joinColumns = @JoinColumn(name = "restaurant_id"))
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "method", length = 30, nullable = false)
    private Set<PaymentMethod> paymentMethods = new HashSet<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "restaurant_service_options", joinColumns = @JoinColumn(name = "restaurant_id"))
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "service", length = 30, nullable = false)
    private Set<ServiceOption> serviceOptions = new HashSet<>();

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false, unique = true)
    private User owner;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected Restaurant() {
    }

    public Restaurant(String name, User owner) {
        this.name = name;
        this.owner = owner;
        this.currency = DEFAULT_CURRENCY;
        this.paymentMethods.add(PaymentMethod.CASH_ON_ARRIVAL);
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public Long getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCuisine() { return cuisine; }
    public void setCuisine(String cuisine) { this.cuisine = cuisine; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getCurrency() { return currency == null || currency.isBlank() ? DEFAULT_CURRENCY : currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getOpeningHours() { return openingHours; }
    public void setOpeningHours(String openingHours) { this.openingHours = openingHours; }

    public Long getLogoVersion() { return logoVersion; }
    public void setLogoVersion(Long logoVersion) { this.logoVersion = logoVersion; }

    public Set<PaymentMethod> getPaymentMethods() { return paymentMethods; }
    public void replacePaymentMethods(Collection<PaymentMethod> methods) {
        paymentMethods.clear();
        paymentMethods.addAll(methods);
    }

    public Set<ServiceOption> getServiceOptions() { return serviceOptions; }
    public void replaceServiceOptions(Collection<ServiceOption> options) {
        serviceOptions.clear();
        serviceOptions.addAll(options);
    }

    public User getOwner() { return owner; }

    public Instant getCreatedAt() { return createdAt; }
}
