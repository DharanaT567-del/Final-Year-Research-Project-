package com.naada.apigateway.controller;

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
import com.naada.apigateway.dto.ChatRequestDto;
import com.naada.apigateway.dto.ChatResponseDto;
import com.naada.apigateway.service.TutorService;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ChatControllerTest {

    private MockMvc mockMvc;

    @Mock
    private TutorService tutorService;

    @InjectMocks
    private ChatController chatController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(chatController).build();
    }

    @Test
    void chat_ValidRequest_ReturnsOkWithResponse() throws Exception {
        ChatResponseDto mockResponse = new ChatResponseDto(
                "Dadra is a 6-beat rhythmic cycle commonly used in semi-classical music.",
                1712345678000L
        );

        when(tutorService.askTutor(any(), eq("Explain Dadra taal")))
                .thenReturn(mockResponse);

        ChatRequestDto request = new ChatRequestDto("Explain Dadra taal");

        mockMvc.perform(post("/api/v1/tutor/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply").value("Dadra is a 6-beat rhythmic cycle commonly used in semi-classical music."))
                .andExpect(jsonPath("$.timestamp").value(1712345678000L));
    }

    @Test
    void chat_BlankMessage_ReturnsBadRequest() throws Exception {
        ChatRequestDto request = new ChatRequestDto("");

        mockMvc.perform(post("/api/v1/tutor/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Message cannot be empty"));
    }

    @Test
    void chat_ServiceNotConfigured_Returns503ServiceUnavailable() throws Exception {
        when(tutorService.askTutor(any(), any()))
                .thenThrow(new IllegalStateException("AI Tutor is not configured. Set GEMINI_API_KEY."));

        ChatRequestDto request = new ChatRequestDto("What is a sitar?");

        mockMvc.perform(post("/api/v1/tutor/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("AI Tutor is not available"))
                .andExpect(jsonPath("$.message").value("AI Tutor is not configured. Set GEMINI_API_KEY."));
    }

    @Test
    void chat_QuotaExceeded_Returns429TooManyRequests() throws Exception {
        when(tutorService.askTutor(any(), any()))
                .thenThrow(new RuntimeException("API quota exceeded for current model"));

        ChatRequestDto request = new ChatRequestDto("Tell me about ragas");

        mockMvc.perform(post("/api/v1/tutor/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error").value("AI service quota exceeded. Please try again later."));
    }

    @Test
    void chat_Timeout_Returns504GatewayTimeout() throws Exception {
        when(tutorService.askTutor(any(), any()))
                .thenThrow(new RuntimeException("Connection timed out while waiting for response"));

        ChatRequestDto request = new ChatRequestDto("Who is Amaradeva?");

        mockMvc.perform(post("/api/v1/tutor/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isGatewayTimeout())
                .andExpect(jsonPath("$.error").value("The AI service timed out. Please try again."));
    }
}
