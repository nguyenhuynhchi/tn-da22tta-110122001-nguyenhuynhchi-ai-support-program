package com.notest.spring_ai_demo.dto.response;

import java.time.Instant;

public record ChatMessageResponse(
    String conversationId,
    String message,
    String role,
    Instant createDate

) {

}
