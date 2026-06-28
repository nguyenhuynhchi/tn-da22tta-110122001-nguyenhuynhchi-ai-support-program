package com.notest.spring_ai_demo.repository;

import com.notest.spring_ai_demo.entity.ChatMessage;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {

    List<ChatMessage> findByConversationIdOrderByCreateDateAsc(String conversationId);
}
