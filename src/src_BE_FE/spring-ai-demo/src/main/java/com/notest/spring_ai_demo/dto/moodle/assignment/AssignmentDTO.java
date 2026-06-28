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
public class AssignmentDTO {
    String id;
    String cmid;
    int course;
    String name;
    String intro;
    List<InTroAttachmentDTO> introattachments;
    int introformat;
    String activity;
    long duedate;
    long timemodified;
    int grade;
}
