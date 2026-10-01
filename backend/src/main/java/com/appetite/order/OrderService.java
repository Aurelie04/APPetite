package com.appetite.order;

import com.appetite.common.ApiException;
import com.appetite.order.OrderDtos.OrderDto;
import com.appetite.order.OrderDtos.OrderLineRequest;
import com.appetite.order.OrderDtos.PlaceOrderRequest;
import com.appetite.restaurant.Restaurant;
import com.appetite.restaurant.RestaurantRepository;
import com.appetite.restaurant.RestaurantService;
import com.appetite.restaurant.ServiceOption;
import com.appetite.restaurant.menu.MenuItem;
import com.appetite.restaurant.menu.MenuItemRepository;
import com.appetite.user.User;
import com.appetite.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.appetite.common.Strings.blankToNull;

@Service
public class OrderService {

    /** Orders still waiting for the restaurant; stops one account from flooding a kitchen. */
    static final int MAX_PENDING_ORDERS = 5;

    private final OrderRepository orderRepository;
    private final RestaurantRepository restaurantRepository;
    private final RestaurantService restaurantService;
    private final MenuItemRepository menuItemRepository;
    private final UserRepository userRepository;

    public OrderService(OrderRepository orderRepository, RestaurantRepository restaurantRepository,
                        RestaurantService restaurantService, MenuItemRepository menuItemRepository,
                        UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.restaurantRepository = restaurantRepository;
        this.restaurantService = restaurantService;
        this.menuItemRepository = menuItemRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public OrderDto place(String customerEmail, PlaceOrderRequest request) {
        User customer = userRepository.findByEmailIgnoreCase(customerEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Please sign in to continue."));
        Restaurant restaurant = restaurantRepository.findWithDetailsById(request.restaurantId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Restaurant not found"));

        if (orderRepository.countByCustomerEmailIgnoreCaseAndStatus(customerEmail, OrderStatus.PLACED) >= MAX_PENDING_ORDERS) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "You already have " + MAX_PENDING_ORDERS + " orders waiting for a restaurant. Please wait until one is accepted.");
        }
        if (!restaurant.getPaymentMethods().contains(request.paymentMethod())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This restaurant doesn't accept this payment method");
        }
        if (restaurant.getServiceOptions().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This restaurant is not taking orders yet");
        }
        if (!restaurant.getServiceOptions().contains(request.serviceOption())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This restaurant doesn't offer " + label(request.serviceOption()));
        }

        String address = blankToNull(request.deliveryAddress());
        String phone = blankToNull(request.contactPhone());
        if (request.serviceOption() == ServiceOption.DELIVERY) {
            if (address == null) throw new ApiException(HttpStatus.BAD_REQUEST, "Please enter a delivery address");
            if (phone == null) throw new ApiException(HttpStatus.BAD_REQUEST, "Please enter a phone number for the delivery");
        } else {
            address = null;
        }

        Map<Long, Integer> quantities = mergeLines(request.items());
        Map<Long, MenuItem> menuItems = menuItemRepository.findAllById(quantities.keySet()).stream()
                .collect(Collectors.toMap(MenuItem::getId, Function.identity()));

        Order order = new Order(customer, restaurant, request.serviceOption(), request.paymentMethod());
        order.setDeliveryAddress(address);
        order.setContactPhone(phone);
        order.setNote(blankToNull(request.note()));
        quantities.forEach((itemId, quantity) -> {
            MenuItem item = menuItems.get(itemId);
            // Prices always come from the database, never from the client.
            if (item == null || !item.getRestaurant().getId().equals(restaurant.getId())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "One of the items is no longer on the menu, please review your cart");
            }
            if (!item.isAvailable()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, item.getName() + " is not available right now, please remove it from your cart");
            }
            order.addItem(item.getId(), item.getName(), item.getPrice(), quantity);
        });

        return OrderDto.from(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public List<OrderDto> listForCustomer(String customerEmail) {
        return orderRepository.findTop50ByCustomerEmailIgnoreCaseOrderByCreatedAtDesc(customerEmail)
                .stream().map(OrderDto::from).toList();
    }

    @Transactional
    public OrderDto cancelByCustomer(String customerEmail, Long orderId) {
        Order order = orderRepository.findByIdAndCustomerEmailIgnoreCase(orderId, customerEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!order.getStatus().cancellableByCustomer()) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "The restaurant has already accepted this order, please call them to change it");
        }
        order.moveTo(OrderStatus.CANCELLED);
        return OrderDto.from(order);
    }

    @Transactional(readOnly = true)
    public List<OrderDto> listForRestaurant(String ownerEmail) {
        Restaurant restaurant = restaurantService.requireOwnedRestaurant(ownerEmail);
        return orderRepository.findTop100ByRestaurantIdOrderByCreatedAtDesc(restaurant.getId())
                .stream().map(OrderDto::from).toList();
    }

    @Transactional
    public OrderDto updateStatusByRestaurant(String ownerEmail, Long orderId, OrderStatus next) {
        Restaurant restaurant = restaurantService.requireOwnedRestaurant(ownerEmail);
        Order order = orderRepository.findByIdAndRestaurantId(orderId, restaurant.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!order.getStatus().nextForRestaurant(order.getServiceOption()).contains(next)) {
            throw new ApiException(HttpStatus.CONFLICT, "This order can't be moved to that status anymore, please refresh");
        }
        order.moveTo(next);
        return OrderDto.from(order);
    }

    private static Map<Long, Integer> mergeLines(List<OrderLineRequest> lines) {
        Map<Long, Integer> quantities = new LinkedHashMap<>();
        for (OrderLineRequest line : lines) {
            int total = quantities.merge(line.menuItemId(), line.quantity(), Integer::sum);
            if (total > OrderDtos.MAX_QUANTITY) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "You can order at most " + OrderDtos.MAX_QUANTITY + " of the same item");
            }
        }
        return quantities;
    }

    private static String label(ServiceOption option) {
        return switch (option) {
            case DELIVERY -> "delivery";
            case TAKEAWAY -> "takeaway";
            case DINE_IN -> "dine-in";
        };
    }
}
