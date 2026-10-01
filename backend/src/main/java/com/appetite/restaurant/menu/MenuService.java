package com.appetite.restaurant.menu;

import com.appetite.common.ApiException;
import com.appetite.restaurant.Restaurant;
import com.appetite.restaurant.RestaurantService;
import com.appetite.restaurant.menu.MenuDtos.MenuItemDto;
import com.appetite.restaurant.menu.MenuDtos.MenuItemRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.RoundingMode;
import java.util.List;

@Service
public class MenuService {

    static final int MAX_ITEMS_PER_RESTAURANT = 200;

    private final MenuItemRepository menuItemRepository;
    private final RestaurantService restaurantService;

    public MenuService(MenuItemRepository menuItemRepository, RestaurantService restaurantService) {
        this.menuItemRepository = menuItemRepository;
        this.restaurantService = restaurantService;
    }

    @Transactional(readOnly = true)
    public List<MenuItemDto> listForOwner(String ownerEmail) {
        Restaurant restaurant = restaurantService.requireOwnedRestaurant(ownerEmail);
        return menuItemRepository.findByRestaurantIdOrderByCategoryAscNameAsc(restaurant.getId())
                .stream().map(MenuItemDto::from).toList();
    }

    @Transactional
    public MenuItemDto create(String ownerEmail, MenuItemRequest request) {
        Restaurant restaurant = restaurantService.requireOwnedRestaurant(ownerEmail);
        if (menuItemRepository.countByRestaurantId(restaurant.getId()) >= MAX_ITEMS_PER_RESTAURANT) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "A menu can have at most " + MAX_ITEMS_PER_RESTAURANT + " items");
        }
        MenuItem item = new MenuItem(restaurant);
        apply(item, request);
        return MenuItemDto.from(menuItemRepository.save(item));
    }

    @Transactional
    public MenuItemDto update(String ownerEmail, Long itemId, MenuItemRequest request) {
        MenuItem item = requireOwnedItem(ownerEmail, itemId);
        apply(item, request);
        return MenuItemDto.from(item);
    }

    @Transactional
    public void delete(String ownerEmail, Long itemId) {
        menuItemRepository.delete(requireOwnedItem(ownerEmail, itemId));
    }

    private MenuItem requireOwnedItem(String ownerEmail, Long itemId) {
        Restaurant restaurant = restaurantService.requireOwnedRestaurant(ownerEmail);
        // Looking the item up by restaurant too means owners can never touch another restaurant's items.
        return menuItemRepository.findByIdAndRestaurantId(itemId, restaurant.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Menu item not found"));
    }

    private static void apply(MenuItem item, MenuItemRequest request) {
        item.setName(request.name().trim());
        item.setDescription(blankToNull(request.description()));
        item.setKind(request.kind());
        item.setCategory(blankToNull(request.category()));
        item.setPrice(request.price().setScale(2, RoundingMode.HALF_UP));
        item.setAvailable(request.available() == null || request.available());
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
