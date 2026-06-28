package com.notest.spring_ai_demo.mapper;

import com.notest.spring_ai_demo.dto.response.SuggestionResponse;
import com.notest.spring_ai_demo.entity.Suggestion;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface SuggestionMapper {
    Suggestion toSuggestion(SuggestionResponse suggestionResponse);

    SuggestionResponse toResponse(Suggestion suggestion);
}
