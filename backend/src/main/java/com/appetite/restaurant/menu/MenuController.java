package com.appetite.restaurant.menu;

import com.appetite.restaurant.menu.MenuDtos.MenuItemDto;
import com.appetite.restaurant.menu.MenuDtos.MenuItemRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants/me/menu")
@PreAuthorize("hasRole('RESTAURANT')")
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @GetMapping
    public List<MenuItemDto> list(@AuthenticationPrincipal UserDetails principal) {
        return menuService.listForOwner(principal.getUsername());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MenuItemDto create(@AuthenticationPrincipal UserDetails principal,
                              @Valid @RequestBody MenuItemRequest request) {
        return menuService.create(principal.getUsername(), request);
    }

    @PutMapping("/{itemId}")
    public MenuItemDto update(@AuthenticationPrincipal UserDetails principal,
                              @PathVariable Long itemId,
                              @Valid @RequestBody MenuItemRequest request) {
        return menuService.update(principal.getUsername(), itemId, request);
    }

    @DeleteMapping("/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserDetails principal, @PathVariable Long itemId) {
        menuService.delete(principal.getUsername(), itemId);
    }
}
