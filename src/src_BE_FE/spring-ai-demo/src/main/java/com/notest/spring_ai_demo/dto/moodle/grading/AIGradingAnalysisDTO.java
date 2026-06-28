package com.notest.spring_ai_demo.dto.moodle.grading;

import com.notest.spring_ai_demo.dto.moodle.submission.SubmissionFileDTO;
import java.util.List;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AIGradingAnalysisDTO {

    String userId;
    String fullname;

    List<SubmissionFileDTO> files;

    List<String> missingCriteria;
    Integer estimatedScore;

}
