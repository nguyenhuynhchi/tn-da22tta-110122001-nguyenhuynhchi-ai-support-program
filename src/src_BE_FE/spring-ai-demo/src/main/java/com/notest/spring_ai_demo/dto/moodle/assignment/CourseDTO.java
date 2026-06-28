package com.notest.spring_ai_demo.dto.moodle.assignment;

import java.util.List;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CourseDTO {
    int id;
    String fullname;
    String shortname;
    long timemodified;
    List<AssignmentDTO> assignments;
}
