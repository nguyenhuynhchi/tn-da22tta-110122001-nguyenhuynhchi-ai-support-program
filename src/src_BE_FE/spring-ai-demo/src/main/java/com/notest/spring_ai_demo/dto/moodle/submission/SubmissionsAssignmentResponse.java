package com.notest.spring_ai_demo.dto.moodle.submission;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmissionsAssignmentResponse {
    List<AssignmentSubmissionDTO> assignments;
    List<Object> warnings;
}
