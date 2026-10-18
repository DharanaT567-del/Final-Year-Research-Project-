package com.naada.apigateway.dto;

import java.util.List;

public record LyricsResultDto(
        String originalLanguage,
        List<LyricsLineDto> lines,
        List<LyricsVocabularyDto> vocabulary) {
}