package com.notest.spring_ai_demo.dto.moodle.assignment;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssignmentCourseResponse {
    List<CourseDTO> courses;
    List<Object> warnings;
}

