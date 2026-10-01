package com.appetite.order;

import com.appetite.order.OrderDtos.OrderDto;
import com.appetite.order.OrderDtos.UpdateStatusRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Restaurant side of ordering: incoming orders and status updates. */
@RestController
@RequestMapping("/api/restaurants/me/orders")
@PreAuthorize("hasRole('RESTAURANT')")
public class RestaurantOrderController {

    private final OrderService orderService;

    public RestaurantOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public List<OrderDto> list(@AuthenticationPrincipal UserDetails principal) {
        return orderService.listForRestaurant(principal.getUsername());
    }

    @PutMapping("/{orderId}/status")
    public OrderDto updateStatus(@AuthenticationPrincipal UserDetails principal, @PathVariable Long orderId,
                                 @Valid @RequestBody UpdateStatusRequest request) {
        return orderService.updateStatusByRestaurant(principal.getUsername(), orderId, request.status());
    }
}
