package com.notest.spring_ai_demo.entity;

import java.time.LocalDateTime;
import java.util.List;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "analysis_codes")
@CompoundIndex(name = "userId_cmid_idx", def = "{'userId': 1, 'cmid': 1}")
public class AnalysisCode {

    @Id
    String id;

    String assignmentId;
    String userId;
    String cmid;
    Long analysisTimeModified;

    List<FileAnalysis> files;

    RubricEvaluation rubricEvaluation;

    ProjectRelationshipFeedback projectRelationshipFeedback;

    @Data

    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FileAnalysis {
        String fileName;
        String rating;
        String shortFeedback;
        List<String> mainIssues;
        List<String> improvementSuggestions;
        List<String> pseudocode;
        FileMemory fileMemory;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RubricEvaluation {
        List<String> missingCriteria;
        int estimatedScore;
        int maximumScore;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FileMemory {
        String fileName;
        String purpose;
        SyntaxStatus syntaxStatus;
        String importantNotes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SyntaxStatus {
        String status;
        String errorType;
        String errorToken;
        String message;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProjectRelationshipFeedback {
        Boolean hasRelationship;
        String relationshipSummary;
        List<String> projectIssues;
        List<String> projectSuggestions;
    }
}
