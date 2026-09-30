package com.appetite.auth;

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
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class AuthFlowTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void registerLoginForgotAndResetPassword() throws Exception {
        String register = """
                {"email":"Jane@Example.com","password":"Secret@123"}
                """;
        mvc.perform(post("/api/auth/register/client").contentType(MediaType.APPLICATION_JSON).content(register))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("jane@example.com"))
                .andExpect(jsonPath("$.user.role").value("CUSTOMER"));

        mvc.perform(post("/api/auth/register/client").contentType(MediaType.APPLICATION_JSON).content(register))
                .andExpect(status().isConflict());

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"jane@example.com\",\"password\":\"wrong-pass\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));

        String token = extract(login("Secret@123"), "token");

        mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("jane@example.com"));

        mvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Please sign in to continue."));

        MvcResult forgot = mvc.perform(post("/api/auth/forgot-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"jane@example.com\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String resetToken = extract(forgot, "resetUrl").replaceAll(".*token=", "");

        mvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + resetToken + "\",\"password\":\"weakpass\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.password").exists());

        mvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + resetToken + "\",\"password\":\"NewSecret#456\"}"))
                .andExpect(status().isOk());

        mvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + resetToken + "\",\"password\":\"Another!789\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("This reset link is invalid or has expired"));

        assertThat(extract(login("NewSecret#456"), "token")).isNotBlank();
    }

    @Test
    void weakPasswordsAreRejectedWithTheMissingRules() throws Exception {
        mvc.perform(post("/api/auth/register/client").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"weak@example.com\",\"password\":\"password1\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.password")
                        .value("Password must contain an uppercase letter and a special character"));

        mvc.perform(post("/api/auth/register/client").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"weak@example.com\",\"password\":\"Sh0rt!\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.password").value("Password must contain at least 8 characters"));

        mvc.perform(post("/api/auth/register/client").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"weak@example.com\",\"password\":\"Has Space1!\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.password").value("Password must not contain spaces"));
    }

    @Test
    void invalidEmailsAndNamesAreRejected() throws Exception {
        for (String email : new String[]{"not-an-email", "user@localhost", "user@domain.c", "a b@example.com"}) {
            mvc.perform(post("/api/auth/register/client").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"" + email + "\",\"password\":\"Secret@123\"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors.email").exists());
        }

        mvc.perform(post("/api/auth/register/restaurant").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"J0hn <script>","restaurantName":"@@@","email":"owner@example.com","password":"Secret@123"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.fullName").exists())
                .andExpect(jsonPath("$.errors.restaurantName").exists());

        mvc.perform(post("/api/auth/register/restaurant").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"Aurélie N'Dour-Nana","restaurantName":"Chez Aurélie & Co.","email":"aurelie@example.fr","password":"Secret@123"}
                                """))
                .andExpect(status().isCreated());
    }

    @Test
    void repeatedFailedLoginsLockTheAccountTemporarily() throws Exception {
        mvc.perform(post("/api/auth/register/client").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"locked@example.com\",\"password\":\"Secret@123\"}"))
                .andExpect(status().isCreated());

        for (int i = 0; i < 5; i++) {
            mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"locked@example.com\",\"password\":\"Wrong@123\"}"))
                    .andExpect(status().isUnauthorized());
        }

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"locked@example.com\",\"password\":\"Secret@123\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.startsWith("Too many failed sign-in attempts")));
    }

    @Test
    void forgotPasswordDoesNotRevealUnknownEmails() throws Exception {
        mvc.perform(post("/api/auth/forgot-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nobody@example.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resetUrl").doesNotExist());
    }

    private MvcResult login(String password) throws Exception {
        return mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"jane@example.com\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
    }

    private static String extract(MvcResult result, String field) throws Exception {
        Matcher m = Pattern.compile("\"" + field + "\"\\s*:\\s*\"([^\"]+)\"").matcher(result.getResponse().getContentAsString());
        assertThat(m.find()).as("field %s in response", field).isTrue();
        return m.group(1);
    }
}
