package com.notest.spring_ai_demo.mapper;

import com.notest.spring_ai_demo.dto.request.ChatRequest;
import com.notest.spring_ai_demo.entity.Conversation;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ConversationMapper {
    Conversation toConversation (ChatRequest request);
}
