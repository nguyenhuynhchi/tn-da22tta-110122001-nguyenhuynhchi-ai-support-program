package com.notest.spring_ai_demo.repository;

import com.notest.spring_ai_demo.entity.AnalysisCode;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AnalysisCodeRepository extends MongoRepository<AnalysisCode, String> {

    Optional<AnalysisCode> findByCmidAndUserId(
        String cmid,
        String userId
    );

    List<AnalysisCode> findByCmid(String cmid);

    void deleteByCmidAndUserId(String cmid, String userId);

//    Optional<AnalysisCode> findByCourseIdAndAssignmentIdAndUserId(
//        String courseId,
//        String assignmentId,
//        String userId
//    );
}
