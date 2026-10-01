package com.appetite.restaurant;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

/** Logo image bytes, kept apart from {@link Restaurant} so listing restaurants never loads images. */
@Entity
@Table(name = "restaurant_logos")
public class RestaurantLogo {

    public static final int MAX_BYTES = 2 * 1024 * 1024;

    @Id
    private Long restaurantId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;

    @Column(nullable = false, length = 40)
    private String contentType;

    // A length above 64 KB makes Hibernate create a MEDIUMBLOB column on MySQL.
    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(nullable = false, length = MAX_BYTES)
    private byte[] data;

    protected RestaurantLogo() {
    }

    public RestaurantLogo(Restaurant restaurant) {
        this.restaurant = restaurant;
    }

    public Long getRestaurantId() { return restaurantId; }

    public String getContentType() { return contentType; }

    public byte[] getData() { return data; }

    public void replace(String contentType, byte[] data) {
        this.contentType = contentType;
        this.data = data;
    }
}
