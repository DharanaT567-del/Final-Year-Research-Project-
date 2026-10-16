package com.naada.apigateway.service;

public class LyricsProcessingException extends RuntimeException {
    public LyricsProcessingException(String message) {
        super(message);
    }

    public LyricsProcessingException(String message, Throwable cause) {
        super(message, cause);
    }
}