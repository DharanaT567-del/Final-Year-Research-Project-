package com.naada.apigateway.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;

import com.naada.apigateway.dto.ChatResponseDto;

/**
 * Naada AI Tutor — Retrieval-Augmented Generation service.
 * <p>
 * Combines a Gemini-backed {@link ChatClient} with a Pinecone-backed
 * {@link VectorStore} through a {@link QuestionAnswerAdvisor} to deliver
 * contextual answers about Sinhala classical music.
 */
@Service
public class TutorService {

    private static final Logger logger = LoggerFactory.getLogger(TutorService.class);

    // Using Java 17 Text Blocks for clean, readable prompt formatting
    private static final String SYSTEM_PROMPT = """
            You are the Naada AI Music Tutor (නාද AI ගුරුතුමා), an expert mentor specialized in Sinhala classical music, North Indian classical ragas, taals, and lyric interpretation.
            
            KNOWLEDGE BASE CONTEXT:
            You are powered by a curated academic knowledge base containing over 1,800 verified Sinhala classical songs (Strict Classical Maestros like W. D. Amaradeva, Nanda Malini, Sunil Edirisinghe, Victor Rathnayake, Sanath Nandasiri) with expert-annotated lyrical meanings (සරල අර්ථය) and emotional breakdowns (Rasa/Bhava).
            
            INSTRUCTIONS:
            1. Language Preference: Always reply in the same language used by the student (if the student asks in English, reply in English; if asked in Sinhala, reply in Sinhala).
            2. Self-Knowledge: If asked about your capabilities or how many songs you know, clearly state that you have access to a database of 1,800+ Sinhala classical masterpieces.
            3. Song Analysis: When asked about a specific song, use the retrieved context to explain the composer, lyricist, rhythm (taal), emotional tone (Rasa), and simplified lyrical meaning.
            4. Tone: Warm, encouraging, culturally respectful, and pedagogical ("ආයුබෝවන් දුවේ/පුතේ" style when conversing in Sinhala).
            """;

    private final ChatClient chatClient;

    public TutorService(ObjectProvider<ChatClient.Builder> chatClientBuilderProvider,
                        ObjectProvider<VectorStore> vectorStoreProvider) {

        ChatClient.Builder builder = null;
        VectorStore store = null;
        try {
            builder = chatClientBuilderProvider.getIfAvailable();
        } catch (Exception e) {
            logger.debug("ChatClient.Builder bean unavailable: {}", e.getMessage());
        }
        try {
            store = vectorStoreProvider.getIfAvailable();
        } catch (Exception e) {
            logger.debug("VectorStore bean unavailable: {}", e.getMessage());
        }

        if (builder != null) {
            ChatClient.Builder configuredBuilder = builder.defaultSystem(SYSTEM_PROMPT);
            if (store != null) {
                try {
                    configuredBuilder = configuredBuilder.defaultAdvisors(
                            QuestionAnswerAdvisor.builder(store)
                                    // You can increase topK to 3 or 4 if you want to pull more context per query
                                    .searchRequest(SearchRequest.builder().topK(2).build())
                                    .build()
                    );
                    logger.info("Naada AI Tutor initialized with RAG pipeline (Pinecone + Gemini).");
                } catch (Exception e) {
                    logger.warn("Could not attach Pinecone advisor, falling back to direct Gemini: {}", e.getMessage());
                }
            } else {
                logger.info("Naada AI Tutor initialized with direct Gemini LLM.");
            }
            this.chatClient = configuredBuilder.build();
        } else {
            this.chatClient = null;
            logger.warn("Naada AI Tutor DISABLED — set GEMINI_API_KEY and PINECONE_API_KEY to enable.");
        }
    }

    /**
     * Send a user question to the RAG pipeline and return the tutor's response.
     *
     * @param userId      authenticated user identifier (email or UID)
     * @param userMessage the student's question
     * @return tutor reply with timestamp
     * @throws IllegalStateException if the AI subsystem is not configured
     */
    public ChatResponseDto askTutor(String userId, String userMessage) {
        if (chatClient == null) {
            throw new IllegalStateException(
                    "AI Tutor is not configured. Set GEMINI_API_KEY and PINECONE_API_KEY environment variables.");
        }

        logger.debug("Tutor query from user [{}]: {}", userId, userMessage);

        String reply = chatClient.prompt()
                .user(userMessage)
                .call()
                .content();

        return new ChatResponseDto(reply, System.currentTimeMillis());
    }
}