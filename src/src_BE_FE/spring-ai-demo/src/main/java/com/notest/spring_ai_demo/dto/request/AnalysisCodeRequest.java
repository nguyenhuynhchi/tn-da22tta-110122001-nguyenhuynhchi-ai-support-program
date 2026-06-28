package com.notest.spring_ai_demo.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AnalysisCodeRequest(

//    String message,

    String wstoken,

    String courseId,

    @NotBlank
    String assignmentId,

    @NotBlank
    String cmid,

    @NotBlank
    String userId
) {}
