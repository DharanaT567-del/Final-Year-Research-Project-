package com.naada.apigateway.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.naada.apigateway.dto.ChatRequestDto;
import com.naada.apigateway.dto.ChatResponseDto;
import com.naada.apigateway.service.TutorService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/tutor")
public class ChatController {

    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    private final TutorService tutorService;

    public ChatController(TutorService tutorService) {
        this.tutorService = tutorService;
    }

    /**
     * Conversational AI tutor endpoint.
     * Requires a valid Spring JWT in the Authorization header.
     */
    @PostMapping("/chat")
    public ResponseEntity<ChatResponseDto> chat(
            @Valid @RequestBody ChatRequestDto request,
            @AuthenticationPrincipal String userEmail) {

        ChatResponseDto response = tutorService.askTutor(userEmail, request.getMessage());
        return ResponseEntity.ok(response);
    }

    // ── Exception Handlers ──────────────────────────────────────

    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(
            org.springframework.web.bind.MethodArgumentNotValidException ex) {
        String errorMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(org.springframework.context.support.DefaultMessageSourceResolvable::getDefaultMessage)
                .findFirst()
                .orElse("Validation error");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                        "error", errorMessage,
                        "timestamp", System.currentTimeMillis()
                ));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleNotConfigured(IllegalStateException ex) {
        logger.error("Tutor service not configured: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of(
                        "error", "AI Tutor is not available",
                        "message", ex.getMessage(),
                        "timestamp", System.currentTimeMillis()
                ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericError(Exception ex) {
        logger.error("Tutor chat error: {}", ex.getMessage(), ex);

        String userMessage;
        HttpStatus status;

        if (ex.getMessage() != null && ex.getMessage().toLowerCase().contains("quota")) {
            userMessage = "AI service quota exceeded. Please try again later.";
            status = HttpStatus.TOO_MANY_REQUESTS;
        } else if (ex.getMessage() != null
                && (ex.getMessage().toLowerCase().contains("timeout")
                    || ex.getMessage().toLowerCase().contains("timed out"))) {
            userMessage = "The AI service timed out. Please try again.";
            status = HttpStatus.GATEWAY_TIMEOUT;
        } else {
            userMessage = "An error occurred while processing your request.";
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        return ResponseEntity.status(status)
                .body(Map.of(
                        "error", userMessage,
                        "timestamp", System.currentTimeMillis()
                ));
    }
}
