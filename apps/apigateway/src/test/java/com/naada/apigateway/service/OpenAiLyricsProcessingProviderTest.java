package com.naada.apigateway.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.nio.file.Path;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.ObjectMapper;

class OpenAiLyricsProcessingProviderTest {
    @Test
    void processFailsClearlyWhenProviderKeyIsMissing() {
        OpenAiLyricsProcessingProvider provider = new OpenAiLyricsProcessingProvider(
                RestClient.builder(), new ObjectMapper(), "", "https://api.openai.com/v1", "gpt-4o-mini");

        LyricsProcessingException exception = assertThrows(LyricsProcessingException.class,
                () -> provider.process(Path.of("not-used.mp3"), "song.mp3", "audio/mpeg", List.of("English")));

        assertEquals("Lyrics processing is unavailable because OPENAI_API_KEY is not configured.", exception.getMessage());
    }
}