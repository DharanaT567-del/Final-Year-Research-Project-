package com.naada.apigateway.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.naada.apigateway.dto.UserProfileUpdateDto;
import com.naada.apigateway.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Updates user profile in Firestore.
     * Authenticated by JwtAuthenticationFilter via Firebase ID Token.
     */
    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @Valid @RequestBody UserProfileUpdateDto request,
            @AuthenticationPrincipal String principal,
            Authentication authentication) {

        String userIdentifier = null;

        if (authentication != null && authentication.getDetails() instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> details = (Map<String, Object>) authentication.getDetails();
            if (details.get("uid") != null) {
                userIdentifier = details.get("uid").toString();
            }
        }

        if (userIdentifier == null || userIdentifier.isBlank()) {
            if (principal != null && !principal.isBlank()) {
                userIdentifier = principal;
            } else if (authentication != null && authentication.getName() != null && !authentication.getName().isBlank()) {
                userIdentifier = authentication.getName();
            }
        }

        if (userIdentifier == null || userIdentifier.isBlank()) {
            Authentication secAuth = SecurityContextHolder.getContext().getAuthentication();
            if (secAuth != null && secAuth.getName() != null && !secAuth.getName().isBlank()) {
                userIdentifier = secAuth.getName();
            }
        }

        if (userIdentifier == null || userIdentifier.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized: User identity not found"));
        }

        try {
            Map<String, Object> updatedProfile = userService.updateUserProfile(userIdentifier, request);
            return ResponseEntity.ok(updatedProfile);
        } catch (Exception e) {
            logger.error("Error updating user profile for user {}: {}", userIdentifier, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Failed to update profile",
                            "message", e.getMessage() != null ? e.getMessage() : "Unknown error",
                            "timestamp", System.currentTimeMillis()
                    ));
        }
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                        "error", ex.getMessage(),
                        "timestamp", System.currentTimeMillis()
                ));
    }
}
