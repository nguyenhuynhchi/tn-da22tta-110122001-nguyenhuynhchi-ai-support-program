package com.notest.spring_ai_demo.repository;

import com.notest.spring_ai_demo.entity.Suggestion;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SuggestionRepository extends MongoRepository<Suggestion, String> {
    Optional<Suggestion> findByCourseIdAndAssignmentId(String courseId, String assignmentId);

    Suggestion findByCmid(String cmid);

//    Suggestion findByAssignmentId(String assignmentId);
}
