package com.notest.spring_ai_demo.repository;

import com.notest.spring_ai_demo.entity.Conversation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConversationRepository extends MongoRepository<Conversation, String> {
    boolean existsByConversationId(String conversationId);
}
