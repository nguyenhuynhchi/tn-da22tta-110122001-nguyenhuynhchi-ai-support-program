package com.notest.spring_ai_demo.dto.moodle.submission;

import java.util.List;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmissionPluginDTO {
    String type;
    String name;

    // "onlinetext"
    List<EditorField> editorfields;

    // "file"
    List<FileArea> fileareas;

    // --- Lấy đoạn văn bản code trực tuyến ---
    @Data
    public static class EditorField {
        String name;
        String text;
    }

    // --- Lấy thông tin tệp tin đính kèm ---
    @Data
    public static class FileArea {
        String area;
        List<FileInfo> files;
    }

    // --- Chi tiết tệp tin ---
    @Data
    public static class FileInfo {
        String filename;
        String fileurl;  // Link download file
        String mimetype;
    }
}
