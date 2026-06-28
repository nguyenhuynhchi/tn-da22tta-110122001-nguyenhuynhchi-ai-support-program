package com.notest.spring_ai_demo.dto.moodle.assignment;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InTroAttachmentDTO {

    String filename;
    String fileurl;
    String mimetype;
}
