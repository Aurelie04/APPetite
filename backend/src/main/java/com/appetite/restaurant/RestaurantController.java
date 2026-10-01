package com.appetite.restaurant;

import com.appetite.restaurant.RestaurantDtos.RestaurantDetailDto;
import com.appetite.restaurant.RestaurantDtos.RestaurantDto;
import com.appetite.restaurant.RestaurantDtos.UpdateOptionsRequest;
import com.appetite.restaurant.RestaurantDtos.UpdateRestaurantRequest;
import com.appetite.restaurant.RestaurantService.LogoImage;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
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

    @GetMapping("/{id:\\d+}")
    public RestaurantDetailDto detail(@PathVariable Long id) {
        return restaurantService.getDetail(id);
    }

    /** Public so that plain {@code <img>} tags (which cannot send the JWT) can display logos. */
    @GetMapping("/{id:\\d+}/logo")
    public ResponseEntity<byte[]> logo(@PathVariable Long id) {
        LogoImage logo = restaurantService.getLogo(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(logo.contentType()))
                // URLs carry ?v=<upload time>, so a new upload always gets a fresh URL.
                .cacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePublic())
                .body(logo.data());
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('RESTAURANT')")
    public RestaurantDto mine(@AuthenticationPrincipal UserDetails principal) {
        return restaurantService.getForOwner(principal.getUsername());
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('RESTAURANT')")
    public RestaurantDto updateMine(@AuthenticationPrincipal UserDetails principal,
                                    @Valid @RequestBody UpdateRestaurantRequest request) {
        return restaurantService.updateForOwner(principal.getUsername(), request);
    }

    @PutMapping("/me/options")
    @PreAuthorize("hasRole('RESTAURANT')")
    public RestaurantDto updateOptions(@AuthenticationPrincipal UserDetails principal,
                                       @Valid @RequestBody UpdateOptionsRequest request) {
        return restaurantService.updateOptions(principal.getUsername(), request);
    }

    @PostMapping(value = "/me/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('RESTAURANT')")
    public RestaurantDto uploadLogo(@AuthenticationPrincipal UserDetails principal,
                                    @RequestParam("file") MultipartFile file) {
        return restaurantService.uploadLogo(principal.getUsername(), file);
    }

    @DeleteMapping("/me/logo")
    @PreAuthorize("hasRole('RESTAURANT')")
    public RestaurantDto deleteLogo(@AuthenticationPrincipal UserDetails principal) {
        return restaurantService.deleteLogo(principal.getUsername());
    }
}
