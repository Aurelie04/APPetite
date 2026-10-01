package com.appetite.order;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class OrderFlowTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void clientOrdersAndRestaurantProcessesTheOrder() throws Exception {
        String owner = registerRestaurant("Pizza Nova", "owner@pizzanova.com");
        String restaurantId = extractNumber(mvc.perform(get("/api/restaurants/me").header("Authorization", bearer(owner)))
                .andReturn(), "id");
        mvc.perform(put("/api/restaurants/me/options").header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"paymentMethods\":[\"CASH_ON_ARRIVAL\",\"CARD_ONLINE\"],\"serviceOptions\":[\"DELIVERY\",\"TAKEAWAY\"]}"))
                .andExpect(status().isOk());
        String pizza = addItem(owner, "{\"name\":\"Margherita\",\"kind\":\"FOOD\",\"price\":8.5}");
        String soda = addItem(owner, "{\"name\":\"Lemon soda\",\"kind\":\"BEVERAGE\",\"price\":2.25}");
        String hidden = addItem(owner, "{\"name\":\"Truffle special\",\"kind\":\"FOOD\",\"price\":30,\"available\":false}");

        String client = registerClient("hungry@example.com");

        // Prices come from the menu, duplicate lines are merged: 3 x 8.50 + 2 x 2.25 = 30.00
        MvcResult placed = mvc.perform(post("/api/orders").header("Authorization", bearer(client))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"restaurantId":%s,"serviceOption":"DELIVERY","paymentMethod":"CASH_ON_ARRIVAL",
                                 "deliveryAddress":"5 Main Road","contactPhone":"+27 82 555 0101","note":"Ring twice",
                                 "items":[{"menuItemId":%s,"quantity":2},{"menuItemId":%s,"quantity":2},{"menuItemId":%s,"quantity":1}]}
                                """.formatted(restaurantId, pizza, soda, pizza)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PLACED"))
                .andExpect(jsonPath("$.paymentStatus").value("PENDING"))
                .andExpect(jsonPath("$.total").value(30.0))
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(jsonPath("$.items[0].quantity").value(3))
                .andExpect(jsonPath("$.cancellable").value(true))
                .andReturn();
        String orderId = extractNumber(placed, "id");

        // Online payment is marked paid at checkout
        MvcResult online = mvc.perform(post("/api/orders").header("Authorization", bearer(client))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(order(restaurantId, "TAKEAWAY", "CARD_ONLINE", soda, 1)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.deliveryAddress").value(nullValue()))
                .andReturn();

        // Rules: payment/service must be offered, delivery needs an address, hidden items can't be ordered
        mvc.perform(post("/api/orders").header("Authorization", bearer(client)).contentType(MediaType.APPLICATION_JSON)
                        .content(order(restaurantId, "TAKEAWAY", "PAYPAL", soda, 1)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("This restaurant doesn't accept this payment method"));
        mvc.perform(post("/api/orders").header("Authorization", bearer(client)).contentType(MediaType.APPLICATION_JSON)
                        .content(order(restaurantId, "DINE_IN", "CASH_ON_ARRIVAL", soda, 1)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("This restaurant doesn't offer dine-in"));
        mvc.perform(post("/api/orders").header("Authorization", bearer(client)).contentType(MediaType.APPLICATION_JSON)
                        .content(order(restaurantId, "DELIVERY", "CASH_ON_ARRIVAL", soda, 1)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Please enter a delivery address"));
        mvc.perform(post("/api/orders").header("Authorization", bearer(client)).contentType(MediaType.APPLICATION_JSON)
                        .content(order(restaurantId, "TAKEAWAY", "CASH_ON_ARRIVAL", hidden, 1)))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/orders").header("Authorization", bearer(client)).contentType(MediaType.APPLICATION_JSON)
                        .content(order(restaurantId, "TAKEAWAY", "CASH_ON_ARRIVAL", soda, 21)))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/orders").header("Authorization", bearer(client)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"restaurantId\":" + restaurantId + ",\"serviceOption\":\"TAKEAWAY\",\"paymentMethod\":\"CASH_ON_ARRIVAL\",\"items\":[]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Your cart is empty"));

        // Items from another restaurant are rejected
        String rival = registerRestaurant("Rival Pizza", "owner@rivalpizza.com");
        String rivalItem = addItem(rival, "{\"name\":\"Cheap slice\",\"kind\":\"FOOD\",\"price\":1}");
        mvc.perform(post("/api/orders").header("Authorization", bearer(client)).contentType(MediaType.APPLICATION_JSON)
                        .content(order(restaurantId, "TAKEAWAY", "CASH_ON_ARRIVAL", rivalItem, 1)))
                .andExpect(status().isBadRequest());

        // Access: owners can't place orders, clients can't manage restaurant orders, rivals can't see them
        mvc.perform(post("/api/orders").header("Authorization", bearer(owner)).contentType(MediaType.APPLICATION_JSON)
                        .content(order(restaurantId, "TAKEAWAY", "CASH_ON_ARRIVAL", soda, 1)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/restaurants/me/orders").header("Authorization", bearer(client)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/restaurants/me/orders").header("Authorization", bearer(rival)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(put("/api/restaurants/me/orders/" + orderId + "/status").header("Authorization", bearer(rival))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"ACCEPTED\"}"))
                .andExpect(status().isNotFound());

        // The restaurant sees both orders and moves the delivery through its lifecycle
        mvc.perform(get("/api/restaurants/me/orders").header("Authorization", bearer(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[?(@.id == " + orderId + ")].customerEmail", hasItem("hungry@example.com")))
                .andExpect(jsonPath("$[?(@.id == " + orderId + ")].nextStatuses[*]", contains("ACCEPTED", "CANCELLED")));

        mvc.perform(put("/api/restaurants/me/orders/" + orderId + "/status").header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"COMPLETED\"}"))
                .andExpect(status().isConflict());
        for (String next : new String[]{"ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY"}) {
            updateStatus(owner, orderId, next);
        }

        // Once accepted, the client can no longer cancel
        mvc.perform(post("/api/orders/" + orderId + "/cancel").header("Authorization", bearer(client)))
                .andExpect(status().isConflict());

        mvc.perform(put("/api/restaurants/me/orders/" + orderId + "/status").header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"COMPLETED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.nextStatuses", hasSize(0)));

        // Cancelling a paid online order refunds it
        String onlineId = extractNumber(online, "id");
        mvc.perform(post("/api/orders/" + onlineId + "/cancel").header("Authorization", bearer(client)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.paymentStatus").value("REFUNDED"));

        String otherClient = registerClient("someone-else@example.com");
        mvc.perform(post("/api/orders/" + orderId + "/cancel").header("Authorization", bearer(otherClient)))
                .andExpect(status().isNotFound());

        mvc.perform(get("/api/orders").header("Authorization", bearer(client)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].restaurant.name", contains("Pizza Nova", "Pizza Nova")));
        mvc.perform(get("/api/orders").header("Authorization", bearer(otherClient)))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    private void updateStatus(String owner, String orderId, String next) throws Exception {
        mvc.perform(put("/api/restaurants/me/orders/" + orderId + "/status").header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"" + next + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(next));
    }

    private static String order(String restaurantId, String service, String payment, String itemId, int quantity) {
        return """
                {"restaurantId":%s,"serviceOption":"%s","paymentMethod":"%s","items":[{"menuItemId":%s,"quantity":%d}]}
                """.formatted(restaurantId, service, payment, itemId, quantity);
    }

    private String addItem(String token, String json) throws Exception {
        return extractNumber(mvc.perform(post("/api/restaurants/me/menu").header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated())
                .andReturn(), "id");
    }

    private String registerRestaurant(String name, String email) throws Exception {
        return extractString(mvc.perform(post("/api/auth/register/restaurant").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Owner Name\",\"restaurantName\":\"" + name + "\",\"email\":\"" + email
                                + "\",\"password\":\"Secret@123\"}"))
                .andExpect(status().isCreated())
                .andReturn(), "token");
    }

    private String registerClient(String email) throws Exception {
        return extractString(mvc.perform(post("/api/auth/register/client").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Secret@123\"}"))
                .andExpect(status().isCreated())
                .andReturn(), "token");
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }

    private static String extractString(MvcResult result, String field) throws Exception {
        Matcher m = Pattern.compile("\"" + field + "\"\\s*:\\s*\"([^\"]+)\"").matcher(result.getResponse().getContentAsString());
        assertThat(m.find()).as("field %s in response", field).isTrue();
        return m.group(1);
    }

    private static String extractNumber(MvcResult result, String field) throws Exception {
        Matcher m = Pattern.compile("\"" + field + "\"\\s*:\\s*(\\d+)").matcher(result.getResponse().getContentAsString());
        assertThat(m.find()).as("field %s in response", field).isTrue();
        return m.group(1);
    }
}
