import { useState, useEffect, useRef } from "react";
import { chatbotApi } from "../../services/chatbotService";
import MarkdownMessage from "../cpn_chat_suggest_assignment/MarkdownMessage";

const defaultMessages = [
  { role: "ai", content: "Xin chào! Tôi có thể giúp bạn phân tích mã và gợi ý cải tiến." },
];

function ChatAnalysisPanel({ title, courseId, assignmentId, cmid, userId, isDraftAnalysis, projectRelationshipFeedback }) {
  const [messages, setMessages] = useState(defaultMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [nextQuestions, setNextQuestions] = useState([]);
  const [hasHistory, setHasHistory] = useState(false);
  const [historyMessages, setHistoryMessages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const imageInputRef = useRef(null);
  const textareaRef = useRef(null);
  const lastUserMessageRef = useRef(null);
  const chatContainerRef = useRef(null);
  const chatEndRef = useRef(null);

  const formatProjectFeedback = (feedback) => {
    if (!feedback) return "";

    const parts = [];

    parts.push("## Phân tích tổng quan project");

    if (feedback.relationshipSummary) {
      parts.push(feedback.relationshipSummary);
    }

    if (Array.isArray(feedback.projectIssues) && feedback.projectIssues.length > 0) {
      parts.push(
        [
          "**Vấn đề chính:**",
          ...feedback.projectIssues.map((item) => `- ${item}`),
        ].join("\n")
      );
    }

    if (
      Array.isArray(feedback.projectSuggestions) &&
      feedback.projectSuggestions.length > 0
    ) {
      parts.push(
        [
          "**Gợi ý chỉnh sửa:**",
          ...feedback.projectSuggestions.map((item) => `- ${item}`),
        ].join("\n")
      );
    }

    return parts.join("\n\n");
  };

  const parseNextMessageSuggestions = (text) => {
    const marker = "---NEXT_MESSAGE---";
    if (!text.includes(marker)) {
      return { content: text, suggestions: [] };
    }

    const [contentPart, suggestionsPart] = text.split(marker);
    const suggestions = suggestionsPart
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^[\-\*\u2022]\s*/, ""));

    return { content: contentPart.trim(), suggestions };
  };

  const cleanHistoryMessagesAndExtractSuggestions = (history) => {
    let latestSuggestions = [];

    const cleanedMessages = history.map((item) => {
      const rawContent = item.message || item.content || "";
      const role =
        item.role?.toLowerCase() === "assistant"
          ? "ai"
          : item.role?.toLowerCase();

      if (role !== "ai") {
        return { role, content: rawContent };
      }

      const { content, suggestions } = parseNextMessageSuggestions(rawContent);

      if (suggestions.length > 0) {
        latestSuggestions = suggestions;
      }

      return {
        role,
        content,
      };
    });

    return {
      cleanedMessages,
      latestSuggestions,
    };
  };

  const handleSelectImages = (event) => {
    const files = Array.from(event.target.files || []);

    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setSelectedImages((prev) => [...prev, ...newImages]);

    event.target.value = "";
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);

      return prev.filter((_, i) => i !== index);
    });
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";

    const maxHeight = 180;
    const newHeight = textarea.scrollHeight;

    textarea.style.height = `${Math.min(newHeight, maxHeight)}px`;
    textarea.style.overflowY = newHeight > maxHeight ? "auto" : "hidden";
  }, [input]);

  useEffect(() => {
    const mergedMessages = [...defaultMessages];

    const projectContent = formatProjectFeedback(projectRelationshipFeedback);

    if (projectContent) {
      mergedMessages.push({
        role: "ai",
        content: projectContent,
      });
    }

    mergedMessages.push(...historyMessages);

    setMessages(mergedMessages);
  }, [projectRelationshipFeedback, historyMessages]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!cmid || !userId) return;

      try {
        const effectiveCmid = isDraftAnalysis ? `${cmid}_temp` : cmid;

        const history = await chatbotApi.getMessages(
          effectiveCmid,
          userId,
          "ANALYSIS"
        );

        if (Array.isArray(history) && history.length > 0) {
          const { cleanedMessages, latestSuggestions } =
            cleanHistoryMessagesAndExtractSuggestions(history);

          setHistoryMessages(cleanedMessages);
          setNextQuestions(latestSuggestions);
        } else {
          setHistoryMessages([]);
          setNextQuestions([]);
        }
      } catch (error) {
        console.error("getMessages error:", error);
        setHistoryMessages([]);
        setNextQuestions([]);
      }
    };

    loadMessages();
  }, [cmid, userId, isDraftAnalysis]);

  useEffect(() => {
    scrollToBottom("auto");
  }, [messages.length]);

  useEffect(() => {
    return () => {
      historyMessages.forEach((msg) => {
        msg.images?.forEach((img) => {
          URL.revokeObjectURL(img.preview);
        });
      });
    };
  }, []);



  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      chatEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  };

  const scrollToLastUserMessage = () => {
    requestAnimationFrame(() => {
      lastUserMessageRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const sendMessage = async (textParam) => {
    const messageText =
      typeof textParam === "string" ? textParam.trim() : input.trim();

    if (!messageText || sending) return;

    const currentImages = [...selectedImages];

    const userMessage = {
      role: "user",
      content: messageText,
      images: currentImages,
    };

    const loadingMessage = {
      role: "ai",
      content: "Đang phản hồi...",
      loading: true,
    };

    setHistoryMessages((prev) => [...prev, userMessage, loadingMessage]);
    setInput("");
    setNextQuestions([]);
    setSelectedImages([]);
    setSending(true);

    setTimeout(() => {
      scrollToBottom();
    }, 0);

    if (!cmid || !userId || !courseId || !assignmentId) {
      setHistoryMessages((prev) => [
        ...prev.filter((msg) => !msg.loading),
        {
          role: "ai",
          content:
            "Thiếu cmid, userId, courseId hoặc assignmentId, không thể gửi yêu cầu phân tích.",
        },
      ]);
      setSending(false);
      return;
    }

    try {
      const effectiveCmid = isDraftAnalysis ? `${cmid}_temp` : cmid;

      const response = await chatbotApi.sendAnalysisMessage(
        messageText,
        courseId,
        assignmentId,
        effectiveCmid,
        userId,
        currentImages.map((img) => img.file)
      );

      let replyContent = "";

      if (typeof response === "string") {
        replyContent = response;
      } else if (response?.message) {
        replyContent = response.message;
      } else if (response?.response) {
        replyContent = response.response;
      } else {
        replyContent = JSON.stringify(response);
      }

      const { content: cleanedContent, suggestions } =
        parseNextMessageSuggestions(replyContent);

      setHistoryMessages((prev) => [
        ...prev.filter((msg) => !msg.loading),
        {
          role: "ai",
          content: cleanedContent,
        },
      ]);

      setTimeout(() => {
        scrollToLastUserMessage();
        setNextQuestions(suggestions);
      }, 0);
    } catch (error) {
      console.error("sendAnalysisMessage error:", error);

      setHistoryMessages((prev) => [
        ...prev.filter((msg) => !msg.loading),
        {
          role: "ai",
          content: "Lỗi khi gọi API phân tích. Vui lòng thử lại sau.",
        },
      ]);

      setTimeout(() => {
        scrollToLastUserMessage();
      }, 0);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white shadow-lg">
      <div className="border-b border-slate-200 px-6 py-2 bg-[#0F6CBF] text-white">
        <div className="text-lg font-semibold">{title}</div>
      </div>

      <div ref={chatContainerRef} className="relative flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto w-full max-w-4xl space-y-4">
          {messages.map((msg, index) => {
            const lastUserIndex = messages
              .map((item) => item.role)
              .lastIndexOf("user");

            const isLastUserMessage =
              msg.role === "user" && index === lastUserIndex;

            return (
              <div
                key={index}
                ref={isLastUserMessage ? lastUserMessageRef : null}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  className={`rounded-3xl px-4 py-3 text-sm shadow-sm text-left ${msg.role === "user"
                    ? "max-w-[70%] bg-slate-900 text-white"
                    : "w-full bg-slate-100 text-slate-900"
                    }`}
                >
                  {msg.role === "ai" ? (
                    msg.loading ? (
                      <div className="text-slate-500 italic">
                        Đang phản hồi...
                      </div>
                    ) : (
                      <MarkdownMessage content={msg.content} />
                    )
                  ) : (
                    <div className="space-y-2">
                      {msg.images?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {msg.images.map((img, imageIndex) => (
                            <img
                              key={imageIndex}
                              src={img.preview}
                              alt=""
                              className="max-h-48 rounded-xl border border-slate-300 object-cover"
                            />
                          ))}
                        </div>
                      )}

                      {msg.content && (
                        <div className="whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => scrollToBottom()}
        className="absolute bottom-32 right-8 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-xl text-slate-700 shadow-md hover:bg-slate-100"
      >
        ↓
      </button>

      {!sending && nextQuestions.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 pb-2 pt-3">
          <div className="flex flex-wrap gap-2">
            {nextQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => sendMessage(question)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[13px] text-left leading-5 font-medium text-slate-700 hover:bg-slate-300"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-slate-200 bg-slate-50 px-6 py-2">
        <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-300 bg-white px-1 py-1">
          {selectedImages.length > 0 && (
            <div className="mb-2 flex gap-2 overflow-x-auto">
              {selectedImages.map((img, index) => (
                <div
                  key={index}
                  className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-slate-300 bg-slate-100"
                >
                  <img
                    src={img.preview}
                    alt=""
                    className="h-full w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs shadow"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              ref={imageInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleSelectImages}
            />

            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-2xl text-slate-500 hover:bg-slate-100"
            >
              +
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              rows={1}
              placeholder="Nhập câu hỏi về mã nguồn..."
              className="max-h-[180px] min-h-[32px] flex-1 resize-none overflow-y-hidden border-0 bg-transparent px-1 py-1 text-sm leading-5 text-slate-800 outline-none focus:ring-0"
            />

            <button
              onClick={sendMessage}
              disabled={sending}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-950 text-white disabled:opacity-60"
            >
              𖤂
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatAnalysisPanel;
