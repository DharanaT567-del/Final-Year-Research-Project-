package com.naada.apigateway.dto;

public record LyricsVocabularyDto(
        String lineId,
        String term,
        String meaning,
        String explanation) {
}