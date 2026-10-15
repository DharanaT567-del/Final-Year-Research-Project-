package com.naada.apigateway.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.naada.apigateway.dto.LyricsResultDto;

class LyricsJobServiceTest {
    @Test
    void getJobHidesJobsFromOtherOwners() {
        LyricsProcessingProvider provider = mock(LyricsProcessingProvider.class);
        when(provider.process(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyList()))
                .thenReturn(new LyricsResultDto("si", List.of(), List.of()));
        LyricsJobService service = new LyricsJobService(provider, Runnable::run, 1024);
        MockMultipartFile audio = validMp3();

        String jobId = service.createJob("owner-a", audio, List.of("English")).jobId();

        assertNotNull(service.getJob("owner-a", jobId));
        assertNull(service.getJob("owner-b", jobId));
    }

    @Test
    void createJobRejectsAudioWhoseContentDoesNotMatchItsExtension() {
        LyricsJobService service = new LyricsJobService(mock(LyricsProcessingProvider.class), Runnable::run, 1024);
        MockMultipartFile audio = new MockMultipartFile("file", "song.mp3", "audio/mpeg", "not audio".getBytes(StandardCharsets.UTF_8));

        assertThrows(ResponseStatusException.class, () -> service.createJob("owner-a", audio, List.of("English")));
    }

    @Test
    void createJobRejectsOversizedAudio() {
        LyricsJobService service = new LyricsJobService(mock(LyricsProcessingProvider.class), Runnable::run, 3);
        MockMultipartFile audio = validMp3();

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> service.createJob("owner-a", audio, List.of("English")));

        assertEquals(413, exception.getStatusCode().value());
    }

    private MockMultipartFile validMp3() {
        byte[] bytes = new byte[] { 'I', 'D', '3', 4, 0, 0, 0, 0, 0, 0 };
        return new MockMultipartFile("file", "song.mp3", "audio/mpeg", bytes);
    }
}