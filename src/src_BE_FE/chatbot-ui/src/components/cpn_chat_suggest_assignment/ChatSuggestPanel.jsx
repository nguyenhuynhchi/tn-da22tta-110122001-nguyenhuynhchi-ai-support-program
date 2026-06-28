import { useState, useEffect, useRef } from "react";
import MarkdownMessage from "./MarkdownMessage";
import { chatbotApi } from "../../services/chatbotService";

function ChatContent({ userId, cmid, nextQuestions = [] }) {
  const defaultMessages = [
    {
      role: "ai",
      content: "Xin chào 👋 Tôi có thể giúp gì cho bạn?",
    },
  ];

  const [messages, setMessages] = useState(defaultMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [dynamicNextQuestions, setDynamicNextQuestions] = useState([]);
  const chatEndRef = useRef(null);
  const lastUserMessageRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = (behavior = "smooth") => {
    requestAnimationFrame(() => {
      chatEndRef.current?.scrollIntoView({
        behavior,
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

  const parseNextMessageSuggestions = (text = "") => {
    const marker = "---NEXT_MESSAGE---";

    if (!text.includes(marker)) {
      return {
        content: text,
        suggestions: [],
      };
    }

    const [contentPart, suggestionsPart] = text.split(marker);

    const suggestions = suggestionsPart
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^[\-\*\u2022]\s*/, ""));

    return {
      content: contentPart.trim(),
      suggestions,
    };
  };

  useEffect(() => {
    const loadMessages = async () => {
      if (!cmid || !userId) return;

      try {
        const history = await chatbotApi.getMessages(
          cmid,
          userId,
          "SUGGESTION"
        );

        if (history.length > 0) {
          let latestSuggestions = [];

          const cleanedHistory = history.map((item) => {
            const role =
              item.role?.toLowerCase() === "assistant"
                ? "ai"
                : item.role?.toLowerCase();

            const rawContent = item.message || item.content || "";

            if (role === "ai") {
              const { content, suggestions } = parseNextMessageSuggestions(rawContent);

              if (suggestions.length > 0) {
                latestSuggestions = suggestions;
              }

              return {
                role,
                content: formatContent(content),
              };
            }

            return {
              role,
              content: rawContent,
            };
          });

          setMessages(cleanedHistory);
          setDynamicNextQuestions(latestSuggestions);
        } else {
          setMessages(defaultMessages);
          setDynamicNextQuestions([]);
        }
      } catch (error) {
        console.error("getMessages error:", error);

        setMessages(defaultMessages);
      }
    };

    loadMessages();
  }, [cmid, userId]);

  useEffect(() => {
    scrollToBottom("auto");
  }, [messages.length]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";

    const maxHeight = 180;
    const newHeight = textarea.scrollHeight;

    textarea.style.height = `${Math.min(newHeight, maxHeight)}px`;
    textarea.style.overflowY = newHeight > maxHeight ? "auto" : "hidden";
  }, [input]);

  const sendMessage = async (textParam) => {
    const messageText = typeof textParam === "string" ? textParam.trim() : input.trim();
    if (!messageText || sending) return;

    const userMessage = { role: "user", content: messageText };
    const loadingMessage = {
      role: "ai",
      content: "Đang phản hồi...",
      loading: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setInput("");
    setDynamicNextQuestions([]);
    setSending(true);

    setTimeout(() => {
      scrollToBottom();
    }, 0);

    try {
      const rawText = await chatbotApi.sendSuggestMessage(messageText, cmid, userId);
      let aiContent = rawText;

      try {
        const data = JSON.parse(rawText);
        if (typeof data === "string") {
          aiContent = data;
        } else if (data && typeof data === "object") {
          aiContent = data.response || data.message || JSON.stringify(data);
        }
      } catch {
        // response không phải JSON
      }

      const { content: cleanedContent, suggestions } =
        parseNextMessageSuggestions(aiContent || "Không có phản hồi");

      setMessages((prev) => [
        ...prev.filter((msg) => !msg.loading),
        {
          role: "ai",
          content: formatContent(cleanedContent),
        },
      ]);

      setTimeout(() => {
        scrollToLastUserMessage();
        setDynamicNextQuestions(suggestions);
      }, 0);
    } catch (error) {
      console.error("Lỗi:", error);

      setMessages((prev) => [
        ...prev.filter((msg) => !msg.loading),
        {
          role: "ai",
          content: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.",
        },
      ]);

      setTimeout(() => {
        scrollToLastUserMessage();
      }, 0);
    } finally {
      setSending(false);
    }
  };

  const displayNextQuestions =
    dynamicNextQuestions.length > 0 ? dynamicNextQuestions : nextQuestions;

  const hasSuggestions =
    Array.isArray(displayNextQuestions) && displayNextQuestions.length > 0;

  const formatContent = (text) => {
    if (!text) return "";

    return text
      // fix xuống dòng
      .replace(/\n{3,}/g, "\n\n")
      // fix inline code bị tách dòng
      .replace(/`\s*([^\n`]+?)\s*`/g, "`$1`")
      // fix block code sai format: đảm bảo có newline sau closing fence
      .replace(/(```(?:\w*)\n[\s\S]*?\n```)(?=[^\n]|$)/g, "$1\n");
  };

  return (
    <div className="relative flex h-screen flex-col bg-slate-100 text-[14px] leading-6 text-slate-800">
      {/* Header */}
      <div className="bg-[#0F6CBF] px-6 py-2 text-center text-lg font-semibold text-white shadow-sm">
        Chatbot hỗ trợ thực hành bài tập
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto w-full max-w-4xl space-y-4">
          {messages.map((msg, index) => {
            const isLastUserMessage =
              msg.role === "user" &&
              index === messages.map((m) => m.role).lastIndexOf("user");

            return (
              <div
                key={index}
                ref={isLastUserMessage ? lastUserMessageRef : null}
                className={`flex w-full ${msg.role === "user"
                  ? "justify-end"
                  : "justify-start"
                  }`}
              >
                <div
                  className={`rounded-3xl px-4 py-3 text-sm shadow-sm text-left ${msg.role === "user"
                    ? "max-w-[70%] bg-[#0F6CBF] border border-slate-500 text-white"
                    : "w-full border border-slate-200 bg-white text-slate-900"
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
                    <div className="text-[14px] leading-6 text-left">
                      {msg.content}
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
        className="absolute bottom-28 right-8 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-xl text-slate-700 shadow-md hover:bg-slate-100"
      >
        ↓
      </button>

      {/* Suggestion buttons (quick send) */}
      {!sending && hasSuggestions && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 pb-2 pt-3">
          <div className="flex flex-wrap gap-2">
            {displayNextQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="rounded-full border border-slate-200 bg-[#CED4DA] px-3 py-1 text-[13px] leading-5 font-medium text-slate-700 hover:bg-[#CED4DA]/60"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-200 bg-slate-50 px-6 py-2">
        <div className="mx-auto flex w-full max-w-4xl items-end gap-3 rounded-2xl border border-slate-300 bg-white p-2">
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
            placeholder="Nhập câu hỏi..."
            className="flex-1 resize-none overflow-y-hidden rounded-2xl border border-slate-300 bg-white px-4 py-2 text-[14px] leading-6 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <button
            onClick={sendMessage}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white"
          >
            𖤂
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatContent;
