package com.naada.apigateway.service;

import java.nio.file.Path;
import java.util.List;

import com.naada.apigateway.dto.LyricsResultDto;

public interface LyricsProcessingProvider {
    LyricsResultDto process(Path audioFile, String filename, String contentType, List<String> targetLanguages);
}