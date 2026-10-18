package com.naada.apigateway.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TutorServiceTest {

    @Test
    void askTutor_ThrowsIllegalStateException_WhenUnconfigured() {
        @SuppressWarnings("unchecked")
        ObjectProvider<org.springframework.ai.chat.client.ChatClient.Builder> builderProvider = mock(ObjectProvider.class);
        @SuppressWarnings("unchecked")
        ObjectProvider<org.springframework.ai.vectorstore.VectorStore> storeProvider = mock(ObjectProvider.class);

        when(builderProvider.getIfAvailable()).thenReturn(null);
        when(storeProvider.getIfAvailable()).thenReturn(null);

        TutorService service = new TutorService(builderProvider, storeProvider);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                service.askTutor("user@example.com", "What is Dadra taal?")
        );

        assertTrue(ex.getMessage().contains("AI Tutor is not configured"));
    }
}
