package com.naada.apigateway.dto;

public record LyricsJobResponse(
        String jobId,
        String status,
        int progress,
        String error,
        LyricsResultDto result) {
}