package com.naada.apigateway.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.naada.apigateway.dto.LyricsLineDto;
import com.naada.apigateway.dto.LyricsResultDto;
import com.naada.apigateway.dto.LyricsVocabularyDto;

@Component
public class OpenAiLyricsProcessingProvider implements LyricsProcessingProvider {
    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String textModel;

    public OpenAiLyricsProcessingProvider(
            RestClient.Builder restClientBuilder,
            ObjectMapper objectMapper,
            @Value("${OPENAI_API_KEY:${lyrics.openai.api-key:}}") String apiKey,
            @Value("${OPENAI_BASE_URL:${lyrics.openai.base-url:https://api.openai.com/v1}}") String baseUrl,
            @Value("${OPENAI_LYRICS_TEXT_MODEL:${lyrics.openai.text-model:gpt-4o-mini}}") String textModel) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.textModel = textModel;
    }

    @Override
    public LyricsResultDto process(Path audioFile, String filename, String contentType, List<String> targetLanguages) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new LyricsProcessingException("Lyrics processing is unavailable because OPENAI_API_KEY is not configured.");
        }
        JsonNode transcription = transcribe(audioFile, filename, contentType);
        List<TranscriptLine> transcriptLines = extractLines(transcription);
        if (transcriptLines.isEmpty()) {
            throw new LyricsProcessingException("No speech could be transcribed from this audio file.");
        }
        return enrich(transcriptLines, targetLanguages);
    }

    private JsonNode transcribe(Path audioFile, String filename, String contentType) {
        try {
            byte[] content = Files.readAllBytes(audioFile);
            ByteArrayResource audio = new ByteArrayResource(content) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };
            MultiValueMap<String, Object> request = new LinkedMultiValueMap<>();
            HttpHeaders fileHeaders = new HttpHeaders();
            fileHeaders.setContentType(MediaType.parseMediaType(contentType));
            fileHeaders.setContentDispositionFormData("file", filename);
            request.add("file", new HttpEntity<>(audio, fileHeaders));
            request.add("model", "whisper-1");
            request.add("language", "si");
            request.add("response_format", "verbose_json");
            request.add("timestamp_granularities[]", "segment");
            return restClient.post()
                    .uri("/audio/transcriptions")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(request)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException exception) {
            throw providerFailure(exception);
        } catch (IOException | IllegalArgumentException exception) {
            throw new LyricsProcessingException("The audio could not be read for transcription.", exception);
        }
    }

    private List<TranscriptLine> extractLines(JsonNode transcription) {
        List<TranscriptLine> lines = new ArrayList<>();
        JsonNode segments = transcription == null ? null : transcription.get("segments");
        if (segments != null && segments.isArray()) {
            for (JsonNode segment : segments) {
                String text = segment.path("text").asText("").trim();
                if (!text.isEmpty()) {
                        Double start = segment.has("start") && segment.get("start").isNumber()
                            ? segment.get("start").asDouble() : null;
                        Double end = segment.has("end") && segment.get("end").isNumber()
                            ? segment.get("end").asDouble() : null;
                    lines.add(new TranscriptLine("line-" + (lines.size() + 1), text, start, end));
                }
            }
        }
        if (!lines.isEmpty()) {
            return lines;
        }
        String text = transcription == null ? "" : transcription.path("text").asText("");
        for (String line : text.split("\\R")) {
            if (!line.isBlank()) {
                lines.add(new TranscriptLine("line-" + (lines.size() + 1), line.trim(), null, null));
            }
        }
        return lines;
    }

    private LyricsResultDto enrich(List<TranscriptLine> transcriptLines, List<String> targetLanguages) {
        List<Map<String, String>> sourceLines = transcriptLines.stream()
                .map(line -> Map.of("id", line.id(), "text", line.text()))
                .toList();
        String prompt = "You are a careful Sinhala language-learning editor. Simplify each Sinhala lyric line "
                + "for a beginner without adding facts or changing the intended meaning. If meaning is ambiguous, "
                + "preserve that ambiguity in a cautious simplification. Translate each line into every requested "
                + "language. Identify only useful words or idioms present in the source, with contextual meanings "
                + "and learner-friendly explanations. Return JSON only with shape {\"lines\":[{\"id\":string,"
                + "\"simplified\":string,\"translations\":{language:string}}],\"vocabulary\":[{\"lineId\":string,"
                + "\"term\":string,\"meaning\":string,\"explanation\":string}]}. Keep each supplied id exactly "
                + "once and do not invent source lines. Requested languages: " + String.join(", ", targetLanguages)
                + ". Source lines: " + writeJson(sourceLines);
        Map<String, Object> body = Map.of(
                "model", textModel,
                "temperature", 0.2,
                "response_format", Map.of("type", "json_object"),
                "messages", List.of(
                        Map.of("role", "system", "content", "Follow the user's data exactly and return valid JSON."),
                        Map.of("role", "user", "content", prompt)));
        try {
            JsonNode response = restClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
            String content = response == null ? "" : response.path("choices").path(0).path("message").path("content").asText("");
            return parseEnrichment(content, transcriptLines, targetLanguages);
        } catch (RestClientResponseException exception) {
            throw providerFailure(exception);
        } catch (LyricsProcessingException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new LyricsProcessingException("The lyrics could not be simplified and translated.", exception);
        }
    }

    private LyricsResultDto parseEnrichment(String content, List<TranscriptLine> transcriptLines, List<String> languages) {
        try {
            JsonNode root = objectMapper.readTree(content);
            JsonNode resultLines = root.path("lines");
            if (!resultLines.isArray()) {
                throw new LyricsProcessingException("The language service returned an incomplete result.");
            }
            Map<String, JsonNode> processed = new HashMap<>();
            for (JsonNode line : resultLines) {
                String id = line.path("id").asText("");
                if (id.isBlank() || processed.putIfAbsent(id, line) != null) {
                    throw new LyricsProcessingException("The language service returned invalid line relationships.");
                }
            }
            List<LyricsLineDto> result = new ArrayList<>();
            for (TranscriptLine source : transcriptLines) {
                JsonNode line = processed.remove(source.id());
                String simplified = line == null ? "" : line.path("simplified").asText("").trim();
                JsonNode translationNode = line == null ? null : line.get("translations");
                Map<String, String> translations = new HashMap<>();
                for (String language : languages) {
                    String translation = translationNode == null ? "" : translationNode.path(language).asText("").trim();
                    if (translation.isBlank()) {
                        throw new LyricsProcessingException("The language service returned an incomplete translation.");
                    }
                    translations.put(language, translation);
                }
                if (simplified.isBlank()) {
                    throw new LyricsProcessingException("The language service returned an incomplete simplification.");
                }
                result.add(new LyricsLineDto(source.id(), source.text(), simplified, Map.copyOf(translations),
                        source.startSeconds(), source.endSeconds()));
            }
            if (!processed.isEmpty()) {
                throw new LyricsProcessingException("The language service returned unexpected lyric lines.");
            }
            List<LyricsVocabularyDto> vocabulary = parseVocabulary(root.path("vocabulary"), transcriptLines);
            return new LyricsResultDto("si", List.copyOf(result), vocabulary);
        } catch (LyricsProcessingException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new LyricsProcessingException("The language service returned an unreadable result.", exception);
        }
    }

    private List<LyricsVocabularyDto> parseVocabulary(JsonNode items, List<TranscriptLine> lines) {
        if (!items.isArray()) {
            throw new LyricsProcessingException("The language service returned an incomplete vocabulary result.");
        }
        Set<String> lineIds = new HashSet<>();
        lines.forEach(line -> lineIds.add(line.id()));
        List<LyricsVocabularyDto> vocabulary = new ArrayList<>();
        for (JsonNode item : items) {
            String lineId = item.path("lineId").asText("");
            String term = item.path("term").asText("").trim();
            String meaning = item.path("meaning").asText("").trim();
            String explanation = item.path("explanation").asText("").trim();
            if (!lineIds.contains(lineId) || term.isBlank() || meaning.isBlank() || explanation.isBlank()) {
                throw new LyricsProcessingException("The language service returned invalid vocabulary relationships.");
            }
            vocabulary.add(new LyricsVocabularyDto(lineId, term, meaning, explanation));
        }
        return List.copyOf(vocabulary);
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (IOException exception) {
            throw new LyricsProcessingException("The lyrics could not be prepared for processing.", exception);
        }
    }

    private LyricsProcessingException providerFailure(RestClientResponseException exception) {
        if (exception.getStatusCode().value() == 429) {
            return new LyricsProcessingException("The lyrics provider is busy. Please retry later.", exception);
        }
        if (exception.getStatusCode().is5xxServerError()) {
            return new LyricsProcessingException("The lyrics provider is temporarily unavailable. Please retry later.", exception);
        }
        return new LyricsProcessingException("The lyrics provider rejected the request. Check backend provider configuration.", exception);
    }

    private record TranscriptLine(String id, String text, Double startSeconds, Double endSeconds) {
    }
}