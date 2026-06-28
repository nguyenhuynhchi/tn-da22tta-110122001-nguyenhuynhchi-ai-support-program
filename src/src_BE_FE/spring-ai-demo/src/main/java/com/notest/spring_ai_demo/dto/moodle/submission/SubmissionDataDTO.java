package com.notest.spring_ai_demo.dto.moodle.submission;


import java.util.List;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmissionDataDTO {
    String id;
    String userid;
    int attemptnumber;
    String status; // "submitted", "draft", "new"
    long timemodified;
    List<SubmissionPluginDTO> plugins;
}
