package com.naada.apigateway.controller;

import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.naada.apigateway.dto.UserProfileUpdateDto;
import com.naada.apigateway.service.UserService;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController).build();
    }

    @Test
    void updateProfile_ValidRequest_ReturnsOkWithUpdatedProfile() throws Exception {
        UserProfileUpdateDto request = new UserProfileUpdateDto("Jane Doe", "https://example.com/photo.jpg");
        Map<String, Object> mockUpdated = Map.of(
                "uid", "user123",
                "name", "Jane Doe",
                "displayName", "Jane Doe",
                "photoURL", "https://example.com/photo.jpg"
        );

        when(userService.updateUserProfile(eq("user123"), any(UserProfileUpdateDto.class)))
                .thenReturn(mockUpdated);

        mockMvc.perform(put("/api/v1/users/profile")
                        .principal(new org.springframework.security.authentication.UsernamePasswordAuthenticationToken("user123", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Jane Doe"))
                .andExpect(jsonPath("$.photoURL").value("https://example.com/photo.jpg"))
                .andExpect(jsonPath("$.uid").value("user123"));
    }

    @Test
    void updateProfile_ServiceThrowsException_Returns500() throws Exception {
        UserProfileUpdateDto request = new UserProfileUpdateDto("Jane Doe", null);

        when(userService.updateUserProfile(eq("user123"), any(UserProfileUpdateDto.class)))
                .thenThrow(new RuntimeException("Firestore connection error"));

        mockMvc.perform(put("/api/v1/users/profile")
                        .principal(new org.springframework.security.authentication.UsernamePasswordAuthenticationToken("user123", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("Failed to update profile"));
    }
}
