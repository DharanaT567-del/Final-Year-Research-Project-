package com.naada.apigateway.dto;

import java.util.Map;

public record LyricsLineDto(
        String id,
        String original,
        String simplified,
        Map<String, String> translations,
        Double startSeconds,
        Double endSeconds) {
}