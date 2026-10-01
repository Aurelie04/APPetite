package com.appetite.restaurant;

import com.appetite.common.ApiException;
import com.appetite.restaurant.RestaurantDtos.MenuSummary;
import com.appetite.restaurant.RestaurantDtos.RestaurantDetailDto;
import com.appetite.restaurant.RestaurantDtos.RestaurantDto;
import com.appetite.restaurant.RestaurantDtos.UpdateOptionsRequest;
import com.appetite.restaurant.RestaurantDtos.UpdateRestaurantRequest;
import com.appetite.restaurant.menu.MenuDtos.MenuItemDto;
import com.appetite.restaurant.menu.MenuItemKind;
import com.appetite.restaurant.menu.MenuItemRepository;
import com.appetite.restaurant.menu.MenuItemRepository.MenuStats;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RestaurantService {

    /** Keep in sync with CURRENCIES in frontend/src/utils/restaurantOptions.js. */
    public static final Set<String> SUPPORTED_CURRENCIES = Set.of(
            "EUR", "USD", "GBP", "CHF", "CAD", "ZAR", "NGN", "GHS", "KES", "MAD", "XOF", "XAF");

    public record LogoImage(String contentType, byte[] data) {
    }

    private final RestaurantRepository restaurantRepository;
    private final RestaurantLogoRepository logoRepository;
    private final MenuItemRepository menuItemRepository;

    public RestaurantService(RestaurantRepository restaurantRepository,
                             RestaurantLogoRepository logoRepository,
                             MenuItemRepository menuItemRepository) {
        this.restaurantRepository = restaurantRepository;
        this.logoRepository = logoRepository;
        this.menuItemRepository = menuItemRepository;
    }

    @Transactional(readOnly = true)
    public List<RestaurantDto> listAll() {
        Map<Long, List<MenuStats>> stats = menuItemRepository.availableStats().stream()
                .collect(Collectors.groupingBy(MenuStats::getRestaurantId));
        return restaurantRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(r -> RestaurantDto.from(r, summarize(stats.getOrDefault(r.getId(), List.of()))))
                .toList();
    }

    @Transactional(readOnly = true)
    public RestaurantDetailDto getDetail(Long id) {
        Restaurant restaurant = restaurantRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Restaurant not found"));
        List<MenuItemDto> menu = menuItemRepository.findByRestaurantIdAndAvailableTrueOrderByCategoryAscNameAsc(id)
                .stream().map(MenuItemDto::from).toList();
        return new RestaurantDetailDto(toDto(restaurant), menu);
    }

    @Transactional(readOnly = true)
    public RestaurantDto getForOwner(String ownerEmail) {
        return toDto(requireOwnedRestaurant(ownerEmail));
    }

    @Transactional
    public RestaurantDto updateForOwner(String ownerEmail, UpdateRestaurantRequest request) {
        Restaurant restaurant = requireOwnedRestaurant(ownerEmail);
        restaurant.setName(request.name().trim());
        restaurant.setDescription(blankToNull(request.description()));
        restaurant.setCuisine(blankToNull(request.cuisine()));
        restaurant.setAddress(blankToNull(request.address()));
        restaurant.setPhone(blankToNull(request.phone()));
        restaurant.setOpeningHours(blankToNull(request.openingHours()));
        if (request.currency() != null) {
            if (!SUPPORTED_CURRENCIES.contains(request.currency())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Please choose a supported currency");
            }
            restaurant.setCurrency(request.currency());
        }
        return toDto(restaurant);
    }

    @Transactional
    public RestaurantDto updateOptions(String ownerEmail, UpdateOptionsRequest request) {
        Restaurant restaurant = requireOwnedRestaurant(ownerEmail);
        restaurant.replacePaymentMethods(request.paymentMethods());
        restaurant.replaceServiceOptions(request.serviceOptions() == null ? Set.of() : request.serviceOptions());
        return toDto(restaurant);
    }

    @Transactional
    public RestaurantDto uploadLogo(String ownerEmail, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Please choose an image file");
        }
        if (file.getSize() > RestaurantLogo.MAX_BYTES) {
            throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "The logo must be 2 MB or smaller");
        }
        byte[] data;
        try {
            data = file.getBytes();
        } catch (IOException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The image could not be read, please try another file");
        }
        String contentType = ImageTypes.detect(data)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "The logo must be a PNG, JPG, WEBP or GIF image"));

        Restaurant restaurant = requireOwnedRestaurant(ownerEmail);
        RestaurantLogo logo = logoRepository.findById(restaurant.getId()).orElseGet(() -> new RestaurantLogo(restaurant));
        logo.replace(contentType, data);
        logoRepository.save(logo);
        restaurant.setLogoVersion(System.currentTimeMillis());
        return toDto(restaurant);
    }

    @Transactional
    public RestaurantDto deleteLogo(String ownerEmail) {
        Restaurant restaurant = requireOwnedRestaurant(ownerEmail);
        logoRepository.findById(restaurant.getId()).ifPresent(logoRepository::delete);
        restaurant.setLogoVersion(null);
        return toDto(restaurant);
    }

    @Transactional(readOnly = true)
    public LogoImage getLogo(Long restaurantId) {
        return logoRepository.findById(restaurantId)
                .map(logo -> new LogoImage(logo.getContentType(), logo.getData()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "This restaurant has no logo"));
    }

    public Restaurant requireOwnedRestaurant(String ownerEmail) {
        return restaurantRepository.findByOwnerEmailIgnoreCase(ownerEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No restaurant is linked to this account"));
    }

    private RestaurantDto toDto(Restaurant restaurant) {
        return RestaurantDto.from(restaurant, summarize(menuItemRepository.availableStatsFor(restaurant.getId())));
    }

    private static MenuSummary summarize(List<MenuStats> stats) {
        if (stats.isEmpty()) return MenuSummary.EMPTY;
        long food = 0;
        long beverages = 0;
        BigDecimal priceFrom = null;
        for (MenuStats s : stats) {
            if (s.getKind() == MenuItemKind.FOOD) food += s.getItemCount();
            else beverages += s.getItemCount();
            if (s.getMinPrice() != null && (priceFrom == null || s.getMinPrice().compareTo(priceFrom) < 0)) {
                priceFrom = s.getMinPrice();
            }
        }
        return new MenuSummary(food, beverages, priceFrom);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
