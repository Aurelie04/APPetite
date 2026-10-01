package com.appetite.restaurant;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class MenuAndOptionsFlowTest {

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n', 0, 0, 0, 13, 'I', 'H', 'D', 'R'};

    @Autowired
    private WebApplicationContext context;

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void ownerManagesMenuOptionsAndLogoAndClientsSeeEverything() throws Exception {
        String owner = registerRestaurant("Taco Loco", "taco@loco.com");

        // New restaurants accept cash on arrival by default
        mvc.perform(get("/api/restaurants/me").header("Authorization", bearer(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentMethods", contains("CASH_ON_ARRIVAL")))
                .andExpect(jsonPath("$.currency").value("EUR"))
                .andExpect(jsonPath("$.logoUrl").value(nullValue()));

        mvc.perform(put("/api/restaurants/me").header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Taco Loco","cuisine":"Mexican","currency":"ZAR","openingHours":"Mon-Sun 11:00-23:00"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currency").value("ZAR"))
                .andExpect(jsonPath("$.openingHours").value("Mon-Sun 11:00-23:00"));

        mvc.perform(put("/api/restaurants/me").header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Taco Loco\",\"currency\":\"BTC\"}"))
                .andExpect(status().isBadRequest());

        mvc.perform(put("/api/restaurants/me/options").header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"paymentMethods":["CASH_ON_ARRIVAL","CARD_ONLINE","MOBILE_MONEY"],"serviceOptions":["DELIVERY","TAKEAWAY"]}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentMethods", contains("CASH_ON_ARRIVAL", "CARD_ONLINE", "MOBILE_MONEY")))
                .andExpect(jsonPath("$.serviceOptions", contains("DELIVERY", "TAKEAWAY")));

        mvc.perform(put("/api/restaurants/me/options").header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"paymentMethods\":[],\"serviceOptions\":[]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.paymentMethods").value("Choose at least one payment method"));

        // Menu: two foods, one beverage, one hidden item
        addItem(owner, """
                {"name":"Beef taco","kind":"FOOD","category":"Tacos","price":45.5,"description":"Slow-cooked beef"}
                """);
        addItem(owner, """
                {"name":"Nachos","kind":"FOOD","category":"Sides","price":30}
                """);
        String drinkId = addItem(owner, """
                {"name":"Horchata","kind":"BEVERAGE","category":"Cold drinks","price":"25.00"}
                """);
        addItem(owner, """
                {"name":"Secret salsa","kind":"FOOD","price":5,"available":false}
                """);

        mvc.perform(post("/api/restaurants/me/menu").header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"<script>\",\"kind\":\"FOOD\",\"price\":-1}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.price").exists());

        mvc.perform(put("/api/restaurants/me/menu/" + drinkId).header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Horchata (large)\",\"kind\":\"BEVERAGE\",\"category\":\"Cold drinks\",\"price\":28.999}"))
                .andExpect(status().isBadRequest());

        mvc.perform(put("/api/restaurants/me/menu/" + drinkId).header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Horchata (large)\",\"kind\":\"BEVERAGE\",\"category\":\"Cold drinks\",\"price\":28.5}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Horchata (large)"))
                .andExpect(jsonPath("$.price").value(28.5));

        mvc.perform(get("/api/restaurants/me/menu").header("Authorization", bearer(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(4)));

        // Logo: real PNG accepted, anything else rejected
        mvc.perform(multipart("/api/restaurants/me/logo")
                        .file(new MockMultipartFile("file", "logo.svg", "image/svg+xml",
                                "<svg onload=alert(1)></svg>".getBytes(StandardCharsets.UTF_8)))
                        .header("Authorization", bearer(owner)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("The logo must be a PNG, JPG, WEBP or GIF image"));

        MvcResult uploaded = mvc.perform(multipart("/api/restaurants/me/logo")
                        .file(new MockMultipartFile("file", "logo.png", "image/png", PNG))
                        .header("Authorization", bearer(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.logoUrl", startsWith("/api/restaurants/")))
                .andReturn();
        String logoUrl = extract(uploaded, "logoUrl");

        mvc.perform(get(logoUrl))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"))
                .andExpect(content().bytes(PNG))
                .andExpect(header().string("Cache-Control", startsWith("max-age=")));

        // Client view: list shows options and an available-menu summary, detail shows the menu
        String client = registerClient("menu-fan@example.com");

        mvc.perform(get("/api/restaurants").header("Authorization", bearer(client)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == 'Taco Loco')].menu.foodCount", hasItem(2)))
                .andExpect(jsonPath("$[?(@.name == 'Taco Loco')].menu.beverageCount", hasItem(1)))
                .andExpect(jsonPath("$[?(@.name == 'Taco Loco')].menu.priceFrom", hasItem(28.5)))
                .andExpect(jsonPath("$[?(@.name == 'Taco Loco')].logoUrl", hasItem(logoUrl)));

        String restaurantId = logoUrl.replaceAll("^/api/restaurants/(\\d+)/.*$", "$1");
        mvc.perform(get("/api/restaurants/" + restaurantId).header("Authorization", bearer(client)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.restaurant.name").value("Taco Loco"))
                .andExpect(jsonPath("$.restaurant.serviceOptions", contains("DELIVERY", "TAKEAWAY")))
                .andExpect(jsonPath("$.menu", hasSize(3)))
                .andExpect(jsonPath("$.menu[*].name", hasItem("Beef taco")));

        mvc.perform(get("/api/restaurants/" + restaurantId)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/restaurants/999999").header("Authorization", bearer(client)))
                .andExpect(status().isNotFound());

        // Access rules: clients can't manage menus; owners can't touch another restaurant's items
        mvc.perform(post("/api/restaurants/me/menu").header("Authorization", bearer(client))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Hack\",\"kind\":\"FOOD\",\"price\":1}"))
                .andExpect(status().isForbidden());

        String rival = registerRestaurant("Rival Burgers", "rival@burgers.com");
        mvc.perform(delete("/api/restaurants/me/menu/" + drinkId).header("Authorization", bearer(rival)))
                .andExpect(status().isNotFound());

        mvc.perform(delete("/api/restaurants/me/menu/" + drinkId).header("Authorization", bearer(owner)))
                .andExpect(status().isNoContent());

        mvc.perform(delete("/api/restaurants/me/logo").header("Authorization", bearer(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.logoUrl").value(nullValue()));
        mvc.perform(get(logoUrl)).andExpect(status().isNotFound());
    }

    private String addItem(String token, String json) throws Exception {
        MvcResult result = mvc.perform(post("/api/restaurants/me/menu").header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated())
                .andReturn();
        Matcher m = Pattern.compile("\"id\"\\s*:\\s*(\\d+)").matcher(result.getResponse().getContentAsString());
        assertThat(m.find()).isTrue();
        return m.group(1);
    }

    private String registerRestaurant(String name, String email) throws Exception {
        return extract(mvc.perform(post("/api/auth/register/restaurant").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Owner Name\",\"restaurantName\":\"" + name + "\",\"email\":\"" + email
                                + "\",\"password\":\"Secret@123\"}"))
                .andExpect(status().isCreated())
                .andReturn(), "token");
    }

    private String registerClient(String email) throws Exception {
        return extract(mvc.perform(post("/api/auth/register/client").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Secret@123\"}"))
                .andExpect(status().isCreated())
                .andReturn(), "token");
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }

    private static String extract(MvcResult result, String field) throws Exception {
        Matcher m = Pattern.compile("\"" + field + "\"\\s*:\\s*\"([^\"]+)\"").matcher(result.getResponse().getContentAsString());
        assertThat(m.find()).as("field %s in response", field).isTrue();
        return m.group(1);
    }
}
