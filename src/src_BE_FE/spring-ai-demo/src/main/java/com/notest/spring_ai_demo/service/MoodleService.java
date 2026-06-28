package com.notest.spring_ai_demo.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.notest.spring_ai_demo.dto.moodle.assignment.AssignmentDTO;
import com.notest.spring_ai_demo.dto.moodle.assignment.AssignmentCourseResponse;
import com.notest.spring_ai_demo.dto.moodle.assignment.CourseDTO;
import com.notest.spring_ai_demo.dto.moodle.assignment.InTroAttachmentDTO;
import com.notest.spring_ai_demo.dto.moodle.grading.AIGradingAnalysisDTO;
import com.notest.spring_ai_demo.dto.moodle.submission.SubmissionDataDTO;
import com.notest.spring_ai_demo.dto.moodle.submission.SubmissionFileDTO;
import com.notest.spring_ai_demo.dto.moodle.submission.SubmissionPluginDTO;
import com.notest.spring_ai_demo.dto.moodle.submission.SubmissionPluginDTO.EditorField;
import com.notest.spring_ai_demo.dto.moodle.submission.SubmissionPluginDTO.FileArea;
import com.notest.spring_ai_demo.dto.moodle.submission.SubmissionsAssignmentResponse;
import com.notest.spring_ai_demo.dto.moodle.user.UserInfoDTO;
import com.notest.spring_ai_demo.dto.response.AnalysisCodeResponse;
import com.notest.spring_ai_demo.entity.AnalysisCode;
import com.notest.spring_ai_demo.mapper.AnalysisCodeMapper;
import com.notest.spring_ai_demo.mapper.MoodleMapper;
import com.notest.spring_ai_demo.repository.AnalysisCodeRepository;
import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MoodleService {

    final AnalysisCodeRepository analysisCodeRepository;

    final RestTemplate restTemplate = new RestTemplate();
    final ObjectMapper objectMapper;
    final AnalysisCodeMapper analysisCodeMapper;


    @Value("${moodle.wstoken}")
    String wstoken;

    @Value("${moodle.base-url}")
    private String moodleBaseUrl;

    public AssignmentCourseResponse getAssignmentsInCourse(String courseId) {
        String url = moodleBaseUrl + "/webservice/rest/server.php";

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("wstoken", wstoken);
        map.add("wsfunction", "mod_assign_get_assignments");
        map.add("moodlewsrestformat", "json");
        map.add("courseids[0]", courseId); // Map đúng key Moodle yêu cầu

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
        return restTemplate.postForObject(url, request, AssignmentCourseResponse.class);
    }


    // ------------------- Lọc bài tập theo ID -----------------------
    public String filterAssignmentPromptById(
        AssignmentCourseResponse moodleData,
        String assignmentId
    ) {
        if (moodleData == null || moodleData.getCourses() == null) {
            log.warn("Dữ liệu khóa học từ Moodle trống.");
            return null;
        }

        return moodleData.getCourses().stream()
            .filter(course -> course.getAssignments() != null)
            .flatMap(course -> course.getAssignments().stream()
                .filter(assign -> Objects.equals(assign.getId(), assignmentId))
                .map(assign -> buildAssignmentPrompt(course, assign))
            )
            .findFirst()
            .orElse(null);
    }

    private String buildAssignmentPrompt(CourseDTO course, AssignmentDTO assign) {
        StringBuilder sb = new StringBuilder();

        sb.append("+++++ courses-fullname / Tên khóa học: +++++\n")
            .append(course.getFullname())
            .append("\n\n");
        sb.append("+++++ course-assignments-name / Tên bài tập: +++++\n")
            .append(assign.getName())
            .append("\n\n");
        if (assign.getIntro() != null && !assign.getIntro().isEmpty()) {
            sb.append("+++++ course-assignments-intro / Yêu cầu đề bài: +++++\n")
                .append(assign.getIntro())
                .append("\n");
        }
        if (assign.getActivity() != null && !assign.getActivity().isEmpty()) {
            sb.append("+++++ course-assignments-activity / Hướng dẫn hoạt động: +++++\n")
                .append(assign.getActivity())
                .append("\n");
        }
        if (assign.getIntroattachments() != null
            && !assign.getIntroattachments().isEmpty()) {
            sb.append("\n-----------------------------------------------------------------\n");
            sb.append("course-assignments-introattachments / Nội dung các file đính kèm:");
            sb.append("\n-----------------------------------------------------------------\n");
            for (InTroAttachmentDTO attachment : assign.getIntroattachments()) {
                sb.append("\nTên file: ")
                    .append(attachment.getFilename())
                    .append("\n");
                String fileContent = readWordFile(
                    attachment.getFileurl(),
                    wstoken
                );
                sb.append("Nội dung file:\n")
                    .append(fileContent)
                    .append("\n");
            }
        }

        return sb.toString();
    }

    // ----------------------- Đọc file world -----------------------
    private String readWordFile(String fileUrl, String wstoken) {
        try {
            if (fileUrl == null || fileUrl.isBlank()) {
                return "Không có đường dẫn file.";
            }

            String url = appendTokenToUrl(fileUrl, wstoken);

            byte[] fileBytes = restTemplate.getForObject(url, byte[].class);

            if (fileBytes == null || fileBytes.length == 0) {
                return "Không đọc được nội dung file.";
            }

            try (
                ByteArrayInputStream inputStream = new ByteArrayInputStream(fileBytes);
                XWPFDocument document = new XWPFDocument(inputStream)
            ) {
                StringBuilder content = new StringBuilder();

                // Đọc paragraph ngoài bảng
                for (XWPFParagraph paragraph : document.getParagraphs()) {
                    String text = paragraph.getText();
                    if (text != null && !text.isBlank()) {
                        content.append(text).append("\n");
                    }
                }

                // Đọc nội dung trong bảng
                for (XWPFTable table : document.getTables()) {
                    for (XWPFTableRow row : table.getRows()) {
                        for (XWPFTableCell cell : row.getTableCells()) {
                            String text = cell.getText();
                            if (text != null && !text.isBlank()) {
                                content.append(text.trim()).append(" | ");
                            }
                        }
                        content.append("\n");
                    }
                    content.append("\n");
                }

                return content.toString().trim();
            }

        } catch (Exception e) {
            log.error("Lỗi khi đọc file Word từ Moodle: {}", fileUrl, e);
            return "Không thể đọc nội dung file Word.";
        }
    }

    // ----------------------- Ghép URL với Token -----------------------
    private String appendTokenToUrl(String fileUrl, String wstoken) {
        String separator = fileUrl.contains("?") ? "&" : "?";
        return fileUrl + separator + "token=" + wstoken;
    }

    // ----------------------- Lấy bài nộp trong bài tập -----------------------
    public SubmissionsAssignmentResponse getSubmissionInAssignment(String assignmentId) {
        String url = moodleBaseUrl + "/webservice/rest/server.php";

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("wstoken", wstoken);
        map.add("wsfunction", "mod_assign_get_submissions");
        map.add("moodlewsrestformat", "json");
        map.add("assignmentids[0]", assignmentId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
        return restTemplate.postForObject(url, request, SubmissionsAssignmentResponse.class);
    }

    // -------------------------- Lấy thời gian cập nhật bài đã nộp --------------------------
    public Long getSubmissionTimeModified(String assignmentId, String userId) {

        SubmissionsAssignmentResponse response =
            getSubmissionInAssignment(assignmentId);

        if (response == null
            || response.getAssignments() == null
            || response.getAssignments().isEmpty()) {
            return null;
        }

        return response.getAssignments().stream()
            .flatMap(assign -> assign.getSubmissions().stream())
            .filter(sub -> userId.equals(sub.getUserid()))
            .findFirst()
            .map(SubmissionDataDTO::getTimemodified)
            .orElse(null);
    }

    // -------------------------- Lọc bài đã nộp theo userId --------------------------
    public List<SubmissionFileDTO> filterSubmissionByUserId(SubmissionsAssignmentResponse response,
        String targetUserId) {
        if (response == null || response.getAssignments() == null) {
            return java.util.Collections.emptyList();
        }

        return response.getAssignments().stream()
            .flatMap(assign -> assign.getSubmissions().stream())
            // 1. Lọc đúng sinh viên và trạng thái bài nộp
            .filter(sub -> Objects.equals(sub.getUserid(), targetUserId) && "submitted".equals(
                sub.getStatus()))
            .flatMap(sub -> sub.getPlugins().stream())
            .flatMap(plugin -> {
                // 2. Xử lý dạng nộp Online Text
                if ("onlinetext".equals(plugin.getType()) && plugin.getEditorfields() != null) {
                    return plugin.getEditorfields().stream()
                        .filter(field -> field.getText() != null
                            && !field.getText().trim().isEmpty())
                        .map(field -> SubmissionFileDTO.builder()
                            .name("onlinetext.html") // Đặt tên đại diện cho văn bản trực tuyến
                            .content(
                                field.getText())
                            .type("onlinetext")
                            .build());
                }
                // 3. Xử lý dạng nộp File đính kèm (Lấy ĐẦY ĐỦ các file)
                if ("file".equals(plugin.getType()) && plugin.getFileareas() != null) {
                    return plugin.getFileareas().stream()
                        .filter(area -> area.getFiles() != null)
                        .flatMap(area -> area.getFiles().stream())
                        .map(file -> SubmissionFileDTO.builder()
                            .name(file.getFilename())
                            .url(file.getFileurl())
                            .type("file")
                            .build());
                }
                return java.util.stream.Stream.empty();
            })
            // 4. Thu thập tất cả thành một danh sách
            .collect(java.util.stream.Collectors.toList());
    }

    //    --------------------------  Lấy bài đã nộp theo userId trả về JSON --------------------------
    public List<SubmissionFileDTO> getSubmitJSON(String assignmentId,
        String targetUserId) {
        SubmissionsAssignmentResponse submissionsAssignmentResponse = getSubmissionInAssignment(
            assignmentId);

        return filterSubmissionByUserId(submissionsAssignmentResponse, targetUserId);
    }

    // -------------------------- Lấy nội dung bài đã nộp theo userId --------------------------
    public String getSubmitByUserId(String assignmentId, String targetUserId) {
        // 1. Gọi API lấy danh sách bài nộp từ Moodle
        SubmissionsAssignmentResponse submissionsAssignmentResponse = getSubmissionInAssignment(
            assignmentId);

        // 2. Lọc ra danh sách DTO (onlinetext hoặc file) của sinh viên
        List<SubmissionFileDTO> submissionFileDTOList = filterSubmissionByUserId(
            submissionsAssignmentResponse, targetUserId);

        if (submissionFileDTOList == null || submissionFileDTOList.isEmpty()) {
            return "Sinh viên chưa có dữ liệu nộp bài.";
        }

        // 3. Duyệt qua danh sách và gộp nội dung bài làm
        return submissionFileDTOList.stream()
            .map(fileDTO -> {
                // Tình huống 1: Nếu là văn bản trực tuyến -> Lấy luôn content
                if ("onlinetext".equals(fileDTO.getType())) {
                    // SỬA TẠI ĐÂY: Chỉ lấy dữ liệu khi content KHÔNG null và KHÔNG rỗng
                    if (fileDTO.getContent() != null && !fileDTO.getContent().trim().isEmpty()) {
                        return "[Hình thức: Văn bản trực tuyến]\n" + fileDTO.getContent();
                    }
                    return ""; // Trả về chuỗi rỗng nếu content trống để bị filter loại bỏ
                }

                // Tình huống 2: Nếu là File -> Ghép token, tải về và đọc nội dung file
                if ("file".equals(fileDTO.getType()) && fileDTO.getUrl() != null) {
                    try {
                        String fileUrl = fileDTO.getUrl() + "?token=" + wstoken;

                        // Gọi sang Moodle Server để lấy nội dung file dưới dạng chuỗi (String)
                        String fileContent = restTemplate.getForObject(fileUrl, String.class);

                        return String.format("--- FILE: %s ---\n%s\n", fileDTO.getName(),
                            fileContent);
                    } catch (Exception e) {
                        log.error("Lỗi khi tải file {} từ Moodle: {}", fileDTO.getName(),
                            e.getMessage());
                        return String.format(
                            "--- FILE: %s ---\n[Lỗi: Không thể tải nội dung file này]\n",
                            fileDTO.getName());
                    }
                }
                return "";
            })
            .filter(content -> !content.isEmpty())
            .collect(Collectors.joining("\n\n"));
    }

    public List<UserInfoDTO> getUsersByIds(List<String> userIds) {
        String url = moodleBaseUrl + "/webservice/rest/server.php";

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("wstoken", wstoken);
        map.add("wsfunction", "core_user_get_users_by_field");
        map.add("moodlewsrestformat", "json");
        map.add("field", "id");

        for (int i = 0; i < userIds.size(); i++) {
            map.add("values[" + i + "]", userIds.get(i));
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> request =
            new HttpEntity<>(map, headers);

        UserInfoDTO[] users =
            restTemplate.postForObject(
                url,
                request,
                UserInfoDTO[].class
            );

        return users == null
            ? Collections.emptyList()
            : Arrays.asList(users);
    }

    public String getGradingAndAnalysis(String cmid, String userId)
        throws JsonProcessingException {
        Optional<AnalysisCode> existingAnalysis =
            analysisCodeRepository.findByCmidAndUserId(cmid, userId);

        AnalysisCode analysisCode = existingAnalysis.get();
        return objectMapper.writeValueAsString(
            analysisCodeMapper.toResponse(analysisCode));
    }

    public List<AIGradingAnalysisDTO> getGradingAndAnalysisByAssignment(
        String assignmentId,
        String cmid
    ) {
        SubmissionsAssignmentResponse response =
            getSubmissionInAssignment(assignmentId);

        if (response == null
            || response.getAssignments() == null
            || response.getAssignments().isEmpty()
            || response.getAssignments().get(0).getSubmissions() == null) {
            return Collections.emptyList();
        }

        List<SubmissionDataDTO> submissions =
            response.getAssignments().get(0).getSubmissions()
                .stream()
                .filter(s -> "submitted".equals(s.getStatus()))
                .toList();

        if (submissions.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> userIds = submissions.stream()
            .map(SubmissionDataDTO::getUserid)
            .distinct()
            .toList();

        List<UserInfoDTO> users = getUsersByIds(userIds);

        Map<String, UserInfoDTO> userMap = users.stream()
            .collect(Collectors.toMap(
                UserInfoDTO::getId,
                Function.identity(),
                (oldValue, newValue) -> newValue
            ));

        List<AnalysisCode> analyses =
            analysisCodeRepository.findByCmid(cmid);

        Map<String, AnalysisCode> analysisMap = analyses.stream()
            .collect(Collectors.toMap(
                AnalysisCode::getUserId,
                Function.identity(),
                (oldValue, newValue) -> newValue
            ));

        List<AIGradingAnalysisDTO> result = new ArrayList<>();

        for (SubmissionDataDTO submission : submissions) {
            String userId = submission.getUserid();

            UserInfoDTO user = userMap.get(userId);
            AnalysisCode analysis = analysisMap.get(userId);

            List<SubmissionFileDTO> files = extractSubmittedFiles(submission);

            List<String> missingCriteria = null;
            Integer estimatedScore = null;

            if (analysis != null && analysis.getRubricEvaluation() != null) {
                missingCriteria = analysis.getRubricEvaluation().getMissingCriteria();
                estimatedScore = analysis.getRubricEvaluation().getEstimatedScore();
            }

            result.add(AIGradingAnalysisDTO.builder()
                .userId(userId)
                .fullname(user != null ? user.getFullname() : null)
                .files(files)
                .missingCriteria(missingCriteria)
                .estimatedScore(estimatedScore)
                .build());
        }

        return result;
    }

    private List<SubmissionFileDTO> extractSubmittedFiles(SubmissionDataDTO submission) {
        List<SubmissionFileDTO> files = new ArrayList<>();

        if (submission.getPlugins() == null) {
            return files;
        }

        for (SubmissionPluginDTO plugin : submission.getPlugins()) {
            if (plugin == null || plugin.getType() == null) {
                continue;
            }

            if ("file".equals(plugin.getType())) {
                if (plugin.getFileareas() == null) {
                    continue;
                }

                for (SubmissionPluginDTO.FileArea area : plugin.getFileareas()) {
                    if (area.getFiles() == null) {
                        continue;
                    }

                    for (SubmissionPluginDTO.FileInfo file : area.getFiles()) {
                        files.add(
                            new SubmissionFileDTO(
                                file.getFilename(),
                                file.getFileurl(),
                                null,
                                "file"
                            )
                        );
                    }
                }
            }

            if ("onlinetext".equals(plugin.getType())) {
                if (plugin.getEditorfields() == null) {
                    continue;
                }

                for (SubmissionPluginDTO.EditorField editorField : plugin.getEditorfields()) {

                    SubmissionFileDTO dto = new SubmissionFileDTO();

                    dto.setName("onlinetext.html");
                    dto.setUrl(null);
                    dto.setContent(editorField.getText());
                    dto.setType("onlinetext");

                    files.add(dto);
                }
            }
        }

        return files;
    }

}
