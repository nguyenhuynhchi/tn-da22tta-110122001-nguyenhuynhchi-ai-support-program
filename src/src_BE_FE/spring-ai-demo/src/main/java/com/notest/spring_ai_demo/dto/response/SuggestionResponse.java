package com.notest.spring_ai_demo.dto.response;

import java.util.List;

public record SuggestionResponse(
    String objective,       // Mục tiêu bài tập
    String knowledge,       // Kiến thức cần dùng
    String suggestions,     // Gợi ý thực hiện
    String commonMistakes,  // Lỗi thường gặp
    List<String> nextQuestions // List câu hỏi tiếp theo
) {}
