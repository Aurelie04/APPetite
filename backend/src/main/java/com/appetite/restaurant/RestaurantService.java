package com.appetite.restaurant;

import com.appetite.common.ApiException;
import com.appetite.restaurant.RestaurantDtos.RestaurantDto;
import com.appetite.restaurant.RestaurantDtos.UpdateRestaurantRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;

    public RestaurantService(RestaurantRepository restaurantRepository) {
        this.restaurantRepository = restaurantRepository;
    }

    @Transactional(readOnly = true)
    public List<RestaurantDto> listAll() {
        return restaurantRepository.findAllByOrderByCreatedAtDesc().stream().map(RestaurantDto::from).toList();
    }

    @Transactional(readOnly = true)
    public RestaurantDto getForOwner(String ownerEmail) {
        return RestaurantDto.from(findForOwner(ownerEmail));
    }

    @Transactional
    public RestaurantDto updateForOwner(String ownerEmail, UpdateRestaurantRequest request) {
        Restaurant restaurant = findForOwner(ownerEmail);
        restaurant.setName(request.name().trim());
        restaurant.setDescription(blankToNull(request.description()));
        restaurant.setCuisine(blankToNull(request.cuisine()));
        restaurant.setAddress(blankToNull(request.address()));
        restaurant.setPhone(blankToNull(request.phone()));
        return RestaurantDto.from(restaurant);
    }

    private Restaurant findForOwner(String ownerEmail) {
        return restaurantRepository.findByOwnerEmailIgnoreCase(ownerEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No restaurant is linked to this account"));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
