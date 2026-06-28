package com.notest.spring_ai_demo.enums;

public enum PromptVersion {
    SUGGEST_ASSIGNMENT_SCORING_CRITERIA("prompts/suggestAssignment/pmt_suggest_assignment_scoring_criteria.st"),
    CHAT_BOT_SUGGEST("prompts/suggestAssignment/pmt_chatbot_suggestion.st"),

    ANALYSIS_CODE_HAS_PSEUDOCODE("prompts/analysisCode/pmt_analysisSourceCode_v4.st"), // prompt phân tích code có trả về mã giả
    CHAT_BOT_ANALYSIS("prompts/analysisCode/pmt_chatbot_analysis.st"),
    LOAD_SOURCECODE("prompts/analysisCode/pmt_loadSourceCode.st"),

    MARKDOWN_FORMATTING("prompts/pmt_markdown_formatting.st")
    ;

    private final String path;
    PromptVersion(String path) { this.path = path; }

    public String getPath() { return path; }
}
