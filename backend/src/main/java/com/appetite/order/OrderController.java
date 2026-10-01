package com.appetite.order;

import com.appetite.order.OrderDtos.OrderDto;
import com.appetite.order.OrderDtos.PlaceOrderRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Client side of ordering: checkout, order history and cancellation. */
@RestController
@RequestMapping("/api/orders")
@PreAuthorize("hasRole('CUSTOMER')")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderDto place(@AuthenticationPrincipal UserDetails principal, @Valid @RequestBody PlaceOrderRequest request) {
        return orderService.place(principal.getUsername(), request);
    }

    @GetMapping
    public List<OrderDto> mine(@AuthenticationPrincipal UserDetails principal) {
        return orderService.listForCustomer(principal.getUsername());
    }

    @PostMapping("/{orderId}/cancel")
    public OrderDto cancel(@AuthenticationPrincipal UserDetails principal, @PathVariable Long orderId) {
        return orderService.cancelByCustomer(principal.getUsername(), orderId);
    }
}
