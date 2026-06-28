package com.notest.spring_ai_demo.mapper;

import com.notest.spring_ai_demo.dto.request.ChatRequest;
import com.notest.spring_ai_demo.dto.response.ChatMessageResponse;
import com.notest.spring_ai_demo.entity.ChatMessage;
import java.util.List;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ChatMessageMapper {
    ChatMessage toChatMessage(ChatRequest request);

    ChatMessageResponse toChatMessageResponse(ChatMessage message);

    List<ChatMessageResponse> toChatMessageResponseList(List<ChatMessage> messages);
}
