package com.naada.apigateway.dto;

public class ChatResponseDto {

    private String reply;
    private long timestamp;

    public ChatResponseDto() {}

    public ChatResponseDto(String reply, long timestamp) {
        this.reply = reply;
        this.timestamp = timestamp;
    }

    public String getReply() { return reply; }
    public void setReply(String reply) { this.reply = reply; }
    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}
