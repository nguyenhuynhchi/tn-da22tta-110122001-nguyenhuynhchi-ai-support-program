package com.notest.spring_ai_demo.dto.moodle.submission;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmissionFileDTO {
    String name;
    String url;
    String content;
    String type;
}
