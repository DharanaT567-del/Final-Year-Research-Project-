package com.naada.apigateway.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TutorServiceTest {

    @Test
    void askTutor_ThrowsIllegalStateException_WhenNluServiceUnavailable() {
        TutorService service = new TutorService("http://localhost:59999");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                service.askTutor("user@example.com", "What is Dadra taal?")
        );

        assertTrue(ex.getMessage().contains("NLU service is unavailable"));
    }
}
