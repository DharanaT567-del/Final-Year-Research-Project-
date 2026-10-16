package com.naada.apigateway.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;
import java.util.concurrent.RejectedExecutionException;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.naada.apigateway.dto.LyricsJobResponse;
import com.naada.apigateway.dto.LyricsResultDto;

@Service
public class LyricsJobService {
    private static final long JOB_RETENTION_HOURS = 24;
        private static final Map<String, List<String>> AUDIO_TYPES = Map.of(
            "mp3", List.of("audio/mpeg", "audio/mp3", "audio/mpeg3", "audio/x-mpeg-3"),
            "wav", List.of("audio/wav", "audio/x-wav", "audio/wave"),
            "m4a", List.of("audio/mp4", "audio/x-m4a", "video/mp4", "application/mp4"),
            "mp4", List.of("audio/mp4", "video/mp4", "application/mp4"),
            "webm", List.of("audio/webm", "video/webm"));

    private final LyricsProcessingProvider provider;
    private final Executor taskExecutor;
    private final long maxUploadBytes;
    private final ConcurrentHashMap<String, JobState> jobs = new ConcurrentHashMap<>();

    public LyricsJobService(
            LyricsProcessingProvider provider,
            @Qualifier("lyricsTaskExecutor") Executor taskExecutor,
            @Value("${lyrics.max-upload-bytes:26214400}") long maxUploadBytes) {
        this.provider = provider;
        this.taskExecutor = taskExecutor;
        this.maxUploadBytes = maxUploadBytes;
    }

    public LyricsJobResponse createJob(String ownerId, MultipartFile file, List<String> requestedLanguages) {
        if (ownerId == null || ownerId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        if (file == null || file.isEmpty()) {
            throw badRequest("Choose a non-empty audio file.");
        }
        if (file.getSize() > maxUploadBytes) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Audio file exceeds the configured size limit.");
        }
        List<String> languages = validateLanguages(requestedLanguages);
        AudioType audioType = validateAudio(file);

        Path temporaryFile = stageAudioFile(file, audioType);

        String jobId = UUID.randomUUID().toString();
        JobState job = new JobState(ownerId, Instant.now());
        jobs.put(jobId, job);
        removeExpiredJobs();
        try {
            taskExecutor.execute(() -> processJob(job, temporaryFile, file.getOriginalFilename(), audioType.contentType(), languages));
        } catch (RejectedExecutionException exception) {
            deleteTemporaryFile(temporaryFile);
            job.fail("Lyrics processing is busy. Please try again shortly.");
        }
        return job.response(jobId);
    }

    public LyricsJobResponse getJob(String ownerId, String jobId) {
        removeExpiredJobs();
        JobState job = jobs.get(jobId);
        return job == null || !job.ownerId.equals(ownerId) ? null : job.response(jobId);
    }

    private void processJob(JobState job, Path file, String filename, String contentType, List<String> languages) {
        job.start();
        try {
            LyricsResultDto result = provider.process(file, filename, contentType, languages);
            job.complete(result);
        } catch (LyricsProcessingException exception) {
            job.fail(exception.getMessage());
        } catch (Exception exception) {
            job.fail("Lyrics processing failed. Please retry with another audio file.");
        } finally {
            deleteTemporaryFile(file);
        }
    }

    private List<String> validateLanguages(List<String> requestedLanguages) {
        List<String> languages = requestedLanguages == null ? List.of("English") : requestedLanguages.stream()
                .flatMap(language -> Arrays.stream(language.split(",")))
                .map(String::trim)
                .filter(language -> !language.isEmpty())
                .distinct()
                .toList();
        if (languages.isEmpty() || languages.size() > 2 || languages.stream()
                .anyMatch(language -> !List.of("English", "Tamil").contains(language))) {
            throw badRequest("Choose English and/or Tamil as the target language.");
        }
        return languages;
    }

    private AudioType validateAudio(MultipartFile file) {
        String filename = file.getOriginalFilename();
        String contentType = file.getContentType();
        if (filename == null || contentType == null) {
            throw badRequest("Audio filename and media type are required.");
        }
        int dot = filename.lastIndexOf('.');
        String extension = dot < 0 ? "" : filename.substring(dot + 1).toLowerCase(Locale.ROOT);
        List<String> allowedTypes = AUDIO_TYPES.get(extension);
        String declaredType = contentType.split(";", 2)[0].trim().toLowerCase(Locale.ROOT);
        if (allowedTypes == null || !allowedTypes.contains(declaredType)) {
            throw badRequest("Use an MP3, WAV, M4A, MP4, or WebM audio file with a matching media type.");
        }
        try {
            byte[] header = file.getBytes();
            if (!hasMatchingSignature(header, extension)) {
                throw badRequest("The file content does not match its declared audio format.");
            }
        } catch (IOException exception) {
            throw badRequest("The audio file could not be read.");
        }
        return new AudioType(extension, declaredType);
    }

    private Path stageAudioFile(MultipartFile file, AudioType audioType) {
        Path temporaryFile = null;
        try {
            temporaryFile = Files.createTempFile("naada-lyrics-", "." + audioType.extension());
            Files.write(temporaryFile, file.getBytes());
            return temporaryFile;
        } catch (IOException exception) {
            if (temporaryFile != null) {
                deleteTemporaryFile(temporaryFile);
            }
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "The audio file could not be staged for processing.");
        }
    }

    private boolean hasMatchingSignature(byte[] bytes, String extension) {
        return switch (extension) {
            case "wav" -> bytes.length >= 12 && ascii(bytes, 0, "RIFF") && ascii(bytes, 8, "WAVE");
            case "m4a", "mp4" -> bytes.length >= 12 && ascii(bytes, 4, "ftyp");
            case "webm" -> bytes.length >= 4 && (bytes[0] & 0xff) == 0x1a
                    && (bytes[1] & 0xff) == 0x45 && (bytes[2] & 0xff) == 0xdf && (bytes[3] & 0xff) == 0xa3;
            case "mp3" -> bytes.length >= 3 && (ascii(bytes, 0, "ID3")
                    || ((bytes[0] & 0xff) == 0xff && (bytes[1] & 0xe0) == 0xe0));
            default -> false;
        };
    }

    private boolean ascii(byte[] bytes, int offset, String expected) {
        if (bytes.length < offset + expected.length()) {
            return false;
        }
        for (int index = 0; index < expected.length(); index++) {
            if (bytes[offset + index] != (byte) expected.charAt(index)) {
                return false;
            }
        }
        return true;
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private void removeExpiredJobs() {
        Instant cutoff = Instant.now().minus(JOB_RETENTION_HOURS, ChronoUnit.HOURS);
        jobs.entrySet().removeIf(entry -> entry.getValue().createdAt.isBefore(cutoff));
    }

    private void deleteTemporaryFile(Path file) {
        try {
            Files.deleteIfExists(file);
        } catch (IOException ignored) {
        }
    }

    private record AudioType(String extension, String contentType) {
    }

    private static final class JobState {
        private final String ownerId;
        private final Instant createdAt;
        private volatile String status = "QUEUED";
        private volatile int progress = 0;
        private volatile String error;
        private volatile LyricsResultDto result;

        private JobState(String ownerId, Instant createdAt) {
            this.ownerId = ownerId;
            this.createdAt = createdAt;
        }

        private void start() {
            status = "PROCESSING";
            progress = 10;
        }

        private void complete(LyricsResultDto processedResult) {
            result = processedResult;
            progress = 100;
            status = "COMPLETED";
        }

        private void fail(String message) {
            error = message;
            status = "FAILED";
        }

        private LyricsJobResponse response(String jobId) {
            return new LyricsJobResponse(jobId, status, progress, error, result);
        }
    }
}