package com.notest.spring_ai_demo.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.notest.spring_ai_demo.dto.moodle.assignment.AssignmentCourseResponse;
import com.notest.spring_ai_demo.dto.request.AnalysisCodeRequest;
import com.notest.spring_ai_demo.dto.request.ChatRequest;
import com.notest.spring_ai_demo.dto.response.AnalysisCodeResponse;
import com.notest.spring_ai_demo.dto.response.ChatMessageResponse;
import com.notest.spring_ai_demo.dto.response.SuggestionResponse;
import com.notest.spring_ai_demo.entity.AnalysisCode;
import com.notest.spring_ai_demo.entity.ChatMessage;
import com.notest.spring_ai_demo.entity.Conversation;
import com.notest.spring_ai_demo.entity.Suggestion;
import com.notest.spring_ai_demo.enums.ConversationType;
import com.notest.spring_ai_demo.enums.PromptVersion;
import com.notest.spring_ai_demo.mapper.AnalysisCodeMapper;
import com.notest.spring_ai_demo.mapper.ChatMessageMapper;
import com.notest.spring_ai_demo.mapper.ConversationMapper;
import com.notest.spring_ai_demo.mapper.SuggestionMapper;
import com.notest.spring_ai_demo.repository.AnalysisCodeRepository;
import com.notest.spring_ai_demo.repository.ChatMessageRepository;
import com.notest.spring_ai_demo.repository.ConversationRepository;
import com.notest.spring_ai_demo.repository.SuggestionRepository;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.repository.jdbc.JdbcChatMemoryRepository;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.SystemPromptTemplate;
import org.springframework.ai.content.Media;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeType;
import org.springframework.util.MimeTypeUtils;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatbotService {

    ChatClient chatClient;
    ChatClient noMemoryChatClient;
    ResourceLoader resourceLoader;

    SuggestionMapper suggestionMapper;
    ConversationMapper conversationMapper;
    ObjectMapper objectMapper;
    AnalysisCodeMapper analysisCodeMapper;
    ChatMessageMapper chatMessageMapper;

    MoodleService moodleService;

    SuggestionRepository suggestionRepository;
    ConversationRepository conversationRepository;
    ChatMessageRepository chatMessageRepository;
    AnalysisCodeRepository analysisCodeRepository;
    JdbcChatMemoryRepository jdbcChatMemoryRepository;

    public String createSuggestMessage(ChatRequest request) throws IOException {
        String conversationId = buildConversationId(request.userId(), request.cmid(),
            ConversationType.SUGGESTION);
        checkConversationExists(conversationId, request, ConversationType.SUGGESTION);
        saveMessage(conversationId, request.message(), "user");

        SuggestionResponse suggestionResponse = suggestionMapper.toResponse(
            suggestionRepository.findByCmid(request.cmid()));

        PromptVersion version = PromptVersion.CHAT_BOT_SUGGEST;
        Resource markdownResource =
            resourceLoader.getResource(
                "classpath:" + PromptVersion.MARKDOWN_FORMATTING.getPath()
            );

        String markdownFormatting =
            new String(markdownResource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

        Resource resource = resourceLoader.getResource("classpath:" + version.getPath());

        SystemPromptTemplate systemPromptTemplate = new SystemPromptTemplate(resource);
        Message systemMessage = systemPromptTemplate.createMessage(
            Map.of(
                "markdown_formatting", markdownFormatting,
                "suggestion", suggestionResponse
            ));

        UserMessage userMessage = new UserMessage(request.message());

        Prompt prompt = new Prompt(systemMessage, userMessage);

        String aiResponse = chatClient
            .prompt(prompt)
            .advisors(advisorSpec -> advisorSpec.param(
                ChatMemory.CONVERSATION_ID, conversationId
            ))
            .call()
            .content();

        saveMessage(conversationId, aiResponse, "assistant");

        return aiResponse;
    }

    public String createAnalysisMessage(ChatRequest request, List<MultipartFile> images)
        throws IOException {

        String conversationId = buildConversationId(request.userId(), request.cmid(),
            ConversationType.ANALYSIS);

        checkConversationExists(conversationId, request, ConversationType.ANALYSIS);

        saveMessage(conversationId, request.message(), "user");

        AnalysisCode analysisCode = analysisCodeRepository
            .findByCmidAndUserId(request.cmid(), request.userId())
            .orElseThrow(() -> new RuntimeException("Analysis not found"));
        AnalysisCodeResponse analysisCodeResponse = analysisCodeMapper.toResponse(analysisCode);

        String cleanCmid = request.cmid().replace("_temp", "");
        SuggestionResponse suggestion = suggestionMapper.toResponse(
            suggestionRepository.findByCmid(cleanCmid));

        AssignmentCourseResponse assignmentsInCourse = moodleService.getAssignmentsInCourse(
            request.courseId());
        String assignment = moodleService.filterAssignmentPromptById(assignmentsInCourse,
            request.assignmentId());

        PromptVersion version = PromptVersion.CHAT_BOT_ANALYSIS;

        Resource markdownResource =
            resourceLoader.getResource(
                "classpath:" + PromptVersion.MARKDOWN_FORMATTING.getPath()
            );
        String markdownFormatting =
            new String(markdownResource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        String sourceCode = "";
        if (shouldLoadSourceCode(analysisCodeResponse, request.message(), images)) {
            sourceCode = moodleService.getSubmitByUserId(request.assignmentId(), request.userId());
        }

        Resource resource = resourceLoader.getResource("classpath:" + version.getPath());
        SystemPromptTemplate systemPromptTemplate = new SystemPromptTemplate(resource);
        Message systemMessage = systemPromptTemplate.createMessage(
            Map.of(
                "markdown_formatting", markdownFormatting,
                "suggestion", suggestion,
                "assignment", assignment,
                "analysis", analysisCodeResponse.toString(),
                "source_code", sourceCode
            ));

        UserMessage userMessage =
            buildUserMessageWithImages(request.message(), images);
        Prompt prompt = new Prompt(List.of(systemMessage, userMessage));

        String aiResponse = chatClient
            .prompt(prompt)
            .advisors(advisorSpec -> advisorSpec.param(
                ChatMemory.CONVERSATION_ID, conversationId
            ))
            .call()
            .content();

        saveMessage(conversationId, aiResponse, "assistant");

        return aiResponse;
    }

    private boolean shouldLoadSourceCode(AnalysisCodeResponse analysisCodeResponse, String message, List<MultipartFile> images) {
        PromptVersion version = PromptVersion.LOAD_SOURCECODE;

        Resource resource = resourceLoader.getResource("classpath:" + version.getPath());
        SystemPromptTemplate systemPromptTemplate = new SystemPromptTemplate(resource);
        Message systemMessage = systemPromptTemplate.createMessage(
            Map.of(
                "analysis", analysisCodeResponse.toString()
            ));
        UserMessage userMessage =
            buildUserMessageWithImages(message, images);

        Prompt prompt = new Prompt(List.of(systemMessage, userMessage));

        String aiResponse = chatClient
            .prompt(prompt)
            .call()
            .content();
        log.info("shouldLoadSourceCode: {}", aiResponse);

        if (aiResponse == null) {
            return false;
        }
        return aiResponse.trim().toLowerCase().startsWith("true");
    }



    private UserMessage buildUserMessageWithImages(String text, List<MultipartFile> images) {

        if (images == null || images.isEmpty()) {
            return new UserMessage(text);
        }

        List<Media> mediaList = images.stream()
            .filter(file -> file != null && !file.isEmpty())
            .map(file -> {
                try {
                    String contentType = file.getContentType();
                    if (contentType == null || !contentType.startsWith("image/")) {
                        throw new RuntimeException(
                            "File không phải hình ảnh: " + file.getOriginalFilename());
                    }
                    MimeType mimeType = MimeTypeUtils.parseMimeType(contentType);
                    ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                        @Override
                        public String getFilename() {
                            return file.getOriginalFilename();
                        }
                    };
                    return new Media(mimeType, resource);
                } catch (Exception e) {
                    throw new RuntimeException(
                        "Không thể đọc file ảnh: " + file.getOriginalFilename(), e);
                }
            })
            .toList();

        return UserMessage.builder()
            .text(text)
            .media(mediaList)
            .build();
    }

    private void saveMessage(String conversationId, String message, String role) {
        ChatMessage chatMsg = ChatMessage.builder()
            .conversationId(conversationId)
            .message(message)
            .role(role)
            .createDate(Instant.now())
            .build();
        chatMessageRepository.save(chatMsg);
        log.info("Đã lưu message của {} vào cuộc hội thoại: {}", role, conversationId);
    }

    public List<ChatMessageResponse> getSuggestMessages(String userId, String cmid,
        ConversationType conversationType) {

        String conversationId = buildConversationId(userId, cmid, conversationType);

        List<ChatMessage> messages =
            chatMessageRepository.findByConversationIdOrderByCreateDateAsc(conversationId);

        return chatMessageMapper.toChatMessageResponseList(messages);
    }

    private void checkConversationExists(String conversationId, ChatRequest request,
        ConversationType type) {
        if (!conversationRepository.existsById(conversationId)) {

            Conversation conversation =
                conversationMapper.toConversation(request);

            conversation.setConversationId(conversationId);
            conversation.setType(type);
            conversationRepository.save(conversation);

            log.info("Đã lưu conversation mới: {}", conversationId);

        } else {

            log.info("Conversation đã tồn tại: {}", conversationId);
        }
    }

    // ------------------TEST lấy assignment data truyền vào prompt ----------------
    public String suggestAssignmentTest(String wstoken, String courseId,
        String message, String assignmentId, String cmid) {
        AssignmentCourseResponse assignmentsInCourse = moodleService.getAssignmentsInCourse(
            courseId);
        return moodleService.filterAssignmentPromptById(assignmentsInCourse,
            assignmentId);
    }

    public SuggestionResponse suggestAssignment(String courseId,
        String message, String assignmentId, String cmid) {

        Optional<Suggestion> existingSuggestion = suggestionRepository
            .findByCourseIdAndAssignmentId(courseId, assignmentId);

        if (existingSuggestion.isPresent()) {
            return suggestionMapper.toResponse(existingSuggestion.get());
        }

        // Lấy dữ liệu bài tập từ Moodle
        AssignmentCourseResponse assignmentsInCourse = moodleService.getAssignmentsInCourse(
            courseId);
        String assignment = moodleService.filterAssignmentPromptById(assignmentsInCourse,
            assignmentId);

        PromptVersion version = PromptVersion.SUGGEST_ASSIGNMENT_SCORING_CRITERIA;
        Resource resource = resourceLoader.getResource("classpath:" + version.getPath());
        SystemPromptTemplate systemPromptTemplate = new SystemPromptTemplate(resource);

        Message systemMessage = systemPromptTemplate.createMessage(
            Map.of("assignment", assignment, "format_instructions", getJsonFormatInstructions()));
        UserMessage internalRequest = new UserMessage(
            "Phân tích yêu cầu bài tập và đưa ra gợi ý (ngắn gọn) cho sinh viên học tập phù hợp.");
        Prompt prompt = new Prompt(List.of(systemMessage, internalRequest));

        // Nhận kết quả từ AI
        SuggestionResponse aiResponse = noMemoryChatClient
            .prompt(prompt)
            .call()
            .entity(SuggestionResponse.class);

        if (aiResponse != null) {
            Suggestion newSuggestion = suggestionMapper.toSuggestion(aiResponse);
            newSuggestion.setCourseId(courseId);
            newSuggestion.setAssignmentId(assignmentId);
            newSuggestion.setCmid(cmid);

            suggestionRepository.save(newSuggestion);
        }

        return aiResponse;
    }

    public String analysisCode(AnalysisCodeRequest request, List<MultipartFile> files)
        throws JsonProcessingException {

        boolean hasUploadedFiles = files != null && !files.isEmpty();
        System.out.println("hasUploadedFiles: " + hasUploadedFiles);

        Long moodleTimeModified = null;

        if (!hasUploadedFiles) {

            moodleTimeModified = moodleService.getSubmissionTimeModified(
                request.assignmentId(),
                request.userId()
            );

            Optional<AnalysisCode> existingAnalysis =
                analysisCodeRepository.findByCmidAndUserId(
                    request.cmid(),
                    request.userId()
                );

            if (existingAnalysis.isPresent()) {
                AnalysisCode oldAnalysis = existingAnalysis.get();

                Long oldTimeModified = oldAnalysis.getAnalysisTimeModified();

                if (Objects.equals(oldTimeModified, moodleTimeModified)) {
                    return objectMapper.writeValueAsString(
                        analysisCodeMapper.toResponse(oldAnalysis)
                    );
                }
                analysisCodeRepository.delete(oldAnalysis);
            }
        }else {
            analysisCodeRepository.deleteByCmidAndUserId(request.cmid(), request.userId());
        }

        SuggestionResponse suggestionResponse = suggestionMapper.toResponse(
            suggestionRepository.findByCmid(request.cmid()));
        String suggestionJson = objectMapper.writeValueAsString(suggestionResponse);

//        Lấy đề bài có chứa tiêu chí vào để phân tích code và cho điểm
        AssignmentCourseResponse assignmentsInCourse = moodleService.getAssignmentsInCourse(
            request.courseId());
        String assignment = moodleService.filterAssignmentPromptById(assignmentsInCourse,
            request.assignmentId());

        String sourceCode = (files == null || files.isEmpty())
            ? moodleService.getSubmitByUserId(
            request.assignmentId(),
            request.userId()
        ) : buildSourceCodeFromFiles(files);

//        System.out.println("source code: " + sourceCode);

        PromptVersion version = PromptVersion.ANALYSIS_CODE_HAS_PSEUDOCODE;
        Resource resource = resourceLoader.getResource("classpath:" + version.getPath());
        SystemPromptTemplate systemPromptTemplate = new SystemPromptTemplate(resource);

        Message systemMessage = systemPromptTemplate.createMessage(
            Map.of(
                "assignment", assignment,
                "suggestion", suggestionJson,
                "source_code", sourceCode
            )
        );

        System.out.println("SYSTEM MESSAGE SENT TO AI:");
        System.out.println(systemMessage.getText());

        UserMessage userMessage = new UserMessage("""
            Phân tích toàn bộ source code đã nộp.
            So sánh với yêu cầu bài tập.
            Trả về JSON hợp lệ bằng tiếng Việt.
            """);

        Prompt prompt = new Prompt(List.of(systemMessage, userMessage));

        String finalJson = callAiWithRetry(prompt);

        finalJson = normalizeAnalysisJson(finalJson);

        AnalysisCodeResponse response = parseAnalysisCodeResponse(finalJson);
        AnalysisCode analysisCode = analysisCodeMapper.toEntity(response);

        analysisCode.setAssignmentId(request.assignmentId());
        analysisCode.setUserId(request.userId());
        analysisCode.setCmid(request.cmid());
        analysisCode.setAnalysisTimeModified(
            moodleService.getSubmissionTimeModified(request.assignmentId(), request.userId()));
        analysisCodeRepository.save(analysisCode);

        return finalJson;
    }

    private String callAiWithRetry(Prompt prompt) {
        int maxRetries = 3;
        long delayMillis = 5_000;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                String content = noMemoryChatClient
                    .prompt(prompt)
                    .call()
                    .content();

                if (content == null || content.isBlank()) {
                    throw new RuntimeException("AI returned empty response");
                }
                return content;
            } catch (Exception e) {
                log.warn("AI request failed. Attempt {}/{}", attempt, maxRetries, e);
                if (attempt == maxRetries) {
                    throw new RuntimeException("AI request failed after retries", e);
                }
                sleepBeforeRetry(delayMillis);
                delayMillis *= 2;
            }
        }
        throw new RuntimeException("AI request failed unexpectedly");
    }

    private String buildSourceCodeFromFiles(List<MultipartFile> files) {

        System.out.println("Content in files");
        try {
            StringBuilder sb = new StringBuilder();

            for (MultipartFile file : files) {
                sb.append("\n--- FILE: ")
                    .append(file.getOriginalFilename())
                    .append(" ---\n");

                sb.append(new String(
                    file.getBytes(),
                    StandardCharsets.UTF_8
                ));

                sb.append("\n");
            }

            return sb.toString();
        } catch (IOException e) {
            throw new RuntimeException("Không đọc được file upload", e);
        }
    }

    private String normalizeAnalysisJson(String json) {
        try {
            ObjectNode root = (ObjectNode) objectMapper.readTree(json);

            JsonNode projectNode = root.get("projectRelationshipFeedback");

            if (projectNode != null && projectNode.has("hasRelationship")) {
                boolean hasRelationship = projectNode.path("hasRelationship").asBoolean(false);

                if (!hasRelationship) {
                    root.remove("projectRelationshipFeedback");
                }
            }

            return objectMapper.writeValueAsString(root);

        } catch (Exception e) {
            throw new RuntimeException("Failed to normalize analysis JSON", e);
        }
    }

    private void sleepBeforeRetry(long delayMillis) {
        try {
            log.info("Waiting {} ms before retrying AI request", delayMillis);
            Thread.sleep(delayMillis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while waiting to retry AI request", e);
        }
    }

    private String buildConversationId(
        String userId, String cmid, ConversationType type) {
        return userId + "_" + cmid + "_" + type.name().toLowerCase();
    }

    private AnalysisCodeResponse parseAnalysisCodeResponse(String json) {
        try {
            return objectMapper.readValue(json, AnalysisCodeResponse.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse analysis response JSON", e);
        }
    }

    private String getJsonFormatInstructions() {
        return new BeanOutputConverter<>(SuggestionResponse.class).getFormat();
    }

    public void clearMemory(String userId, String cmid, ConversationType type) {
        String conversationId = buildConversationId(userId, cmid, type);
        jdbcChatMemoryRepository.deleteByConversationId(conversationId);
    }
}