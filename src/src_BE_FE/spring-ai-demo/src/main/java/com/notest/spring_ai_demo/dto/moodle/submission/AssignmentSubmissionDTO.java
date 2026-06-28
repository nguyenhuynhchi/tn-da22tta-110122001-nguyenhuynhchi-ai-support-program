package com.notest.spring_ai_demo.dto.moodle.submission;

import java.util.List;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssignmentSubmissionDTO {
    String assignmentid;
    List<SubmissionDataDTO> submissions;
}
