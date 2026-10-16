package com.naada.apigateway.controller;

import java.util.Arrays;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.naada.apigateway.dto.LyricsJobResponse;
import com.naada.apigateway.service.LyricsJobService;

@RestController
@RequestMapping("/api/v1/lyrics/jobs")
public class LyricsJobController {
    private final LyricsJobService lyricsJobService;

    public LyricsJobController(LyricsJobService lyricsJobService) {
        this.lyricsJobService = lyricsJobService;
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<LyricsJobResponse> createJob(
            @AuthenticationPrincipal String ownerId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "targetLanguages", defaultValue = "English") String targetLanguages) {
        List<String> languages = Arrays.stream(targetLanguages.split(",")).map(String::trim).toList();
        LyricsJobResponse response = lyricsJobService.createJob(ownerId, file, languages);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<LyricsJobResponse> getJob(
            @AuthenticationPrincipal String ownerId,
            @PathVariable String jobId) {
        LyricsJobResponse response = lyricsJobService.getJob(ownerId, jobId);
        return response == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(response);
    }
}