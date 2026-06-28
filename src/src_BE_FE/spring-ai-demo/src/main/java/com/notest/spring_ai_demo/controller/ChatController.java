package com.notest.spring_ai_demo.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.notest.spring_ai_demo.dto.moodle.assignment.AssignmentCourseResponse;
import com.notest.spring_ai_demo.dto.moodle.grading.AIGradingAnalysisDTO;
import com.notest.spring_ai_demo.dto.moodle.submission.SubmissionFileDTO;
import com.notest.spring_ai_demo.dto.moodle.submission.SubmissionsAssignmentResponse;
import com.notest.spring_ai_demo.dto.request.AnalysisCodeRequest;
import com.notest.spring_ai_demo.dto.request.ChatRequest;
import com.notest.spring_ai_demo.dto.response.ChatMessageResponse;
import com.notest.spring_ai_demo.dto.response.SuggestionResponse;
import com.notest.spring_ai_demo.enums.ConversationType;
import com.notest.spring_ai_demo.service.ChatbotService;
import com.notest.spring_ai_demo.service.MoodleService;
import java.io.IOException;
import java.util.List;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatController {

    ChatbotService chatbotService;
    MoodleService moodleService;
    ObjectMapper objectMapper;

    @PostMapping("/chat-suggest")
    public String chatSuggest(@RequestBody ChatRequest request) throws IOException {
        return chatbotService.createSuggestMessage(request);
    }

    @PostMapping(value = "/chat-analysis", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public String chatAnalysis(
        @RequestPart("request") String requestJson,
        @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) throws IOException {

        ChatRequest request = objectMapper.readValue(requestJson, ChatRequest.class);

        return chatbotService.createAnalysisMessage(request, images);
    }

    @PostMapping(value = "/suggest-assignment", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public SuggestionResponse suggestAssignment(
        @RequestParam(name = "courseids[0]") String courseId,
        @RequestParam(required = false) String message,
        @RequestParam (name = "assignmentid") String assignmentId,
        @RequestParam (name = "cmid") String cmid){

        return chatbotService.suggestAssignment(courseId, message, assignmentId, cmid);
    }

    @PostMapping(value = "/suggest-assignment-test", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public String suggestAssignmentTest(
        @RequestParam(required = false) String wstoken,
        @RequestParam(name = "courseids[0]") String courseId,
        @RequestParam(required = false) String message,
        @RequestParam (name = "assignmentid") String assignmentId,
        @RequestParam (name = "cmid") String cmid){

        return chatbotService.suggestAssignmentTest(wstoken, courseId, message, assignmentId, cmid);
    }

    @PostMapping(value = "/analysis-code", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public String analysisCode(
        @ModelAttribute AnalysisCodeRequest request,
        @RequestParam(value = "files", required = false) List<MultipartFile> files) throws JsonProcessingException {
        return chatbotService.analysisCode(request, files);
    }

    @GetMapping("/get-message")
    public List<ChatMessageResponse> getMessages(
        @RequestParam (name = "userId") String userId,
        @RequestParam (name = "cmid") String cmid,
        @RequestParam (name = "conversationType") ConversationType conversationType
    ){
        return chatbotService.getSuggestMessages(userId, cmid, conversationType);
    }

    @DeleteMapping("/clear-memory")
    public void clearMemory(
        @RequestParam (name = "userId") String userId,
        @RequestParam (name = "cmid") String cmid,
        @RequestParam (name = "conversationType") ConversationType conversationType
    ){
        chatbotService.clearMemory(userId, cmid, conversationType);
    }


    // ---------------------------------- TEST
    @PostMapping(value = "/get-grading", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public String getGrading(
        @RequestParam String userId,
        @RequestParam String cmid) throws JsonProcessingException {

        return moodleService.getGradingAndAnalysis(cmid, userId);
    } // cái này không xài

    @GetMapping(value = "/get-grading-analysis")
    public List<AIGradingAnalysisDTO> getGradingAndAnalysisByAssignment(
        @RequestParam String assignmentId,
        @RequestParam String cmid) throws JsonProcessingException {

        return moodleService.getGradingAndAnalysisByAssignment(assignmentId, cmid);
    }

    @PostMapping(value = "/get-submit", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public String getSubmission(
        @RequestParam(name = "assignmentids[0]") String assignmentId,
        @RequestParam String userId){

        return moodleService.getSubmitByUserId(assignmentId, userId);
    }

    @PostMapping(value = "/get-submit-json", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public List<SubmissionFileDTO> getSubmissionJSON(
        @RequestParam(name = "assignmentids[0]") String assignmentId,
        @RequestParam String userId){

        return moodleService.getSubmitJSON(assignmentId, userId);
    }

    @PostMapping(value = "/get-assignment", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public AssignmentCourseResponse getAssignment(
        @RequestParam(name = "courseids[0]") String courseId){

        return moodleService.getAssignmentsInCourse(courseId);
    }

    @PostMapping(value = "/get-submit-assignment", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public SubmissionsAssignmentResponse getSubmitAssignment(
        @RequestParam(name = "assignmentid") String assignmentId){

        return moodleService.getSubmissionInAssignment(assignmentId);
    }



//    @PostMapping("/chat-with-image")
//    String chatWithImage(@RequestParam("file")MultipartFile file, @RequestParam("message") String message) {
//        return chatbotService.chatWithImage(file, message);
//    }
}

