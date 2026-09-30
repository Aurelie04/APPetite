package com.appetite.restaurant;

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
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class RestaurantFlowTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void restaurantRegistersManagesProfileAndClientsSeeIt() throws Exception {
        MvcResult registered = mvc.perform(post("/api/auth/register/restaurant").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"Marco Rossi","restaurantName":"Pizza Napoli","email":"marco@napoli.com","password":"secret123"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.role").value("RESTAURANT"))
                .andExpect(jsonPath("$.user.fullName").value("Marco Rossi"))
                .andReturn();
        String ownerToken = extractToken(registered);

        mvc.perform(get("/api/restaurants/me").header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Pizza Napoli"))
                .andExpect(jsonPath("$.ownerName").value("Marco Rossi"));

        mvc.perform(put("/api/restaurants/me").header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Pizza Napoli","description":"Wood-fired pizza","cuisine":"Pizza","address":"12 Rue de Paris","phone":"+33 1 23 45 67 89"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cuisine").value("Pizza"));

        String clientToken = extractToken(mvc.perform(post("/api/auth/register/client")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"hungry@client.com\",\"password\":\"secret123\"}"))
                .andExpect(status().isCreated())
                .andReturn());

        mvc.perform(get("/api/restaurants").header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", hasItem("Pizza Napoli")))
                .andExpect(jsonPath("$[*].description", hasItem("Wood-fired pizza")));

        mvc.perform(get("/api/restaurants/me").header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/restaurants")).andExpect(status().isUnauthorized());
    }

    private static String extractToken(MvcResult result) throws Exception {
        Matcher m = Pattern.compile("\"token\"\\s*:\\s*\"([^\"]+)\"").matcher(result.getResponse().getContentAsString());
        assertThat(m.find()).isTrue();
        return m.group(1);
    }
}
