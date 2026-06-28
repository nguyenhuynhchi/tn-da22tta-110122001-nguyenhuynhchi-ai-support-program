package com.notest.spring_ai_demo.mapper;

import com.notest.spring_ai_demo.dto.response.AnalysisCodeResponse;
import com.notest.spring_ai_demo.entity.AnalysisCode;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AnalysisCodeMapper {
    AnalysisCodeResponse toResponse(AnalysisCode analysisCode);

    AnalysisCode toEntity(AnalysisCodeResponse response);
}
