package com.notest.spring_ai_demo.entity;

import java.util.List;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "suggestion")
@FieldDefaults(level = AccessLevel.PRIVATE)
@CompoundIndex(name = "course_assignment_idx", def = "{'courseId': 1, 'assignmentId': 1}")
public class Suggestion {
    @MongoId
    String id;

    String courseId;

    String assignmentId;

    String cmid;

    String objective;

    String knowledge;

    String suggestions;

    String commonMistakes;

    List<String> nextQuestions;
}
