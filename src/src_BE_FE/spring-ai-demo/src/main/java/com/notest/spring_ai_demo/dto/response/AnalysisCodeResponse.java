package com.notest.spring_ai_demo.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record AnalysisCodeResponse(
    String id,
    String courseId,
    String assignmentId,
    String userId,
    String cmid,
    List<FileAnalysisResponse> files,
    RubricEvaluation rubricEvaluation,
    ProjectRelationshipFeedbackResponse projectRelationshipFeedback
) {

    public record FileAnalysisResponse(
        String fileName,
        String rating,
        String shortFeedback,
        List<String> mainIssues,
        List<String> improvementSuggestions,
        List<String> pseudocode,
        FileMemoryResponse fileMemory
    ) {}

    public record FileMemoryResponse(
        String fileName,
        String purpose,
        SyntaxStatus syntaxStatus,
        String importantNotes
    ) {}

    public record SyntaxStatus(
        String status,
        String errorType,
        String errorToken,
        String message
    ){}

    public record RubricEvaluation(
        List<String> missingCriteria,
        int estimatedScore,
        int maximumScore
    ){}

    public record ProjectRelationshipFeedbackResponse(
        Boolean hasRelationship,
        String relationshipSummary,
        List<String> missingRequirements,
        List<String> projectIssues,
        List<String> projectSuggestions
    ) {}
}
