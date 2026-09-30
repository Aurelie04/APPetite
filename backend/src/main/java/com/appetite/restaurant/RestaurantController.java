package com.appetite.restaurant;

import com.appetite.restaurant.RestaurantDtos.RestaurantDto;
import com.appetite.restaurant.RestaurantDtos.UpdateRestaurantRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {

    private final RestaurantService restaurantService;

    public RestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @GetMapping
    public List<RestaurantDto> listAll() {
        return restaurantService.listAll();
    }

    @GetMapping("/me")
    public RestaurantDto mine(@AuthenticationPrincipal UserDetails principal) {
        return restaurantService.getForOwner(principal.getUsername());
    }

    @PutMapping("/me")
    public RestaurantDto updateMine(@AuthenticationPrincipal UserDetails principal,
                                    @Valid @RequestBody UpdateRestaurantRequest request) {
        return restaurantService.updateForOwner(principal.getUsername(), request);
    }
}
