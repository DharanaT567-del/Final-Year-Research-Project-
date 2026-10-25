package com.naada.apigateway.service;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.naada.apigateway.dto.ChatResponseDto;

/**
 * Naada AI Tutor — NLU-based service.
 * <p>
 * Calls the in-house FastAPI NLU microservice ({@code nlu_engine})
 * to classify intents, extract song entities, and generate
 * template-based bilingual responses.
 * <p>
 * No external API keys required (no Gemini, no Pinecone).
 */
@Service
public class TutorService {

    private static final Logger logger = LoggerFactory.getLogger(TutorService.class);

    private final RestClient restClient;

    public TutorService(
            @Value("${nlu.service.url:http://localhost:8000}") String baseUrl) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        logger.info("Naada AI Tutor initialized — NLU service at {}", baseUrl);
    }

    /**
     * Send a user question to the NLU pipeline and return the tutor's response.
     *
     * @param userId      authenticated user identifier (email or UID)
     * @param userMessage the student's question
     * @return tutor reply with timestamp
     * @throws IllegalStateException if the NLU service is unavailable
     */
    public ChatResponseDto askTutor(String userId, String userMessage) {
        logger.debug("Tutor query from user [{}]: {}", userId, userMessage);

        try {
            NluReply reply = restClient.post()
                    .uri("/api/v1/nlu/chat")
                    .body(Map.of("message", userMessage, "userId", userId))
                    .retrieve()
                    .body(NluReply.class);

            if (reply == null) {
                throw new IllegalStateException("NLU service returned null response");
            }

            logger.debug("NLU response: intent={}, confidence={}", reply.intent(), reply.confidence());
            return new ChatResponseDto(reply.reply(), System.currentTimeMillis());

        } catch (RestClientException e) {
            logger.error("NLU service call failed: {}", e.getMessage());
            throw new IllegalStateException("NLU service is unavailable", e);
        }
    }

    /**
     * Internal record to deserialize the NLU service JSON response.
     */
    record NluReply(String reply, String intent, double confidence) {}
}