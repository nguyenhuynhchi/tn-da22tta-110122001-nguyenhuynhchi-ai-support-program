import { useEffect, useState, useRef } from "react";
import CodeFileTabs from "./CodeFileTabs";
import SourceCodeViewer from "./SourceCodeViewer";
import ChatAnalysisPanel from "./ChatAnalysisPanel";
import { chatbotApi } from "../../services/chatbotService";
import { moodleApi } from "../../services/moodleService";
import MarkdownMessage from "../cpn_chat_suggest_assignment/MarkdownMessage";


const getCmidFromUrl = () => {
  const normalizedSearch = window.location.search.replace(/&amp;/g, "&");
  const params = new URLSearchParams(normalizedSearch);
  return params.get("cmid") || params.get("amp;cmid");
};

function AnalysisCodePage() {
  const [files, setFiles] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [devUrlToken, setDevUrlToken] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [assignmentId, setAssignmentId] = useState(null);
  const [cmid, setCmid] = useState(null);
  const [userId, setUserId] = useState(null);
  const [courseId, setCourseId] = useState(null);
  const [codeHeight, setCodeHeight] = useState(420);
  const [isDragging, setIsDragging] = useState(false);
  const wrapperRef = useRef(null);
  const [draftFiles, setDraftFiles] = useState([]);
  const [analyzingDraft, setAnalyzingDraft] = useState(false);
  const [isDraftAnalysis, setIsDraftAnalysis] = useState(false);
  const [analysisSidebarOpen, setAnalysisSidebarOpen] = useState(true);
  const didFetchRef = useRef(false);

  const handleSelectDraftFiles = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    setDraftFiles((prevFiles) => {
      const merged = [...prevFiles];

      selectedFiles.forEach((file) => {
        const existed = merged.some(
          (f) =>
            f.name === file.name &&
            f.size === file.size &&
            f.lastModified === file.lastModified
        );

        if (!existed) {
          merged.push(file);
        }
      });

      return merged;
    });

    event.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleSelectDraftFiles({ target: { files } });
    }
  };

  const handleRemoveDraftFile = (indexToRemove) => {
    setDraftFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleAnalyzeDraftFiles = async () => {
    if (draftFiles.length === 0) return;

    if (!courseId || !assignmentId || !cmid || !userId) {
      setError("Thiếu courseId, assignmentId, cmid hoặc userId.");
      return;
    }

    try {
      setAnalyzingDraft(true);
      setError(null);

      const tempCmid = `${cmid}_temp`;

      const rawAnalysis = await chatbotApi.analyzeSubmittedCode(
        {
          courseId,
          assignmentId,
          cmid: tempCmid,
          userId,
        },
        draftFiles
      );

      const parsedAnalysis =
        typeof rawAnalysis === "string" ? JSON.parse(rawAnalysis) : rawAnalysis;

      setAnalysis(parsedAnalysis);

      const uiFiles = await Promise.all(
        draftFiles.map(async (file) => ({
          name: file.name,
          code: await file.text(),
        }))
      );

      setFiles(uiFiles);
      setActiveIndex(0);
    } catch (err) {
      console.error(err);
      setError("Không thể phân tích các file đã chọn.");
    } finally {
      setAnalyzingDraft(false);
      setIsDraftAnalysis(true);
    }
  };

  useEffect(() => {
    if (didFetchRef.current) {
      return;
    }

    didFetchRef.current = true;

    const fetchFiles = async () => {
      setLoading(true);
      setError(null);

      try {
        const rawSearch = window.location.search;
        const normalizedSearch = rawSearch.replace(/&amp;/g, "&");
        const params = new URLSearchParams(normalizedSearch);


        const storageToken = sessionStorage.getItem('chatbot_token');
        const urlToken = params.get('wstoken') || params.get('amp;wstoken');
        const wstoken = storageToken || urlToken;
        if (!storageToken && urlToken) {
          sessionStorage.setItem('chatbot_token', urlToken);
        }
        try { setDevUrlToken(urlToken || null); } catch (e) { }

        const wsfunction = params.get('wsfunction') || params.get('amp;wsfunction');
        const moodlewsrestformat = params.get('moodlewsrestformat') || params.get('amp;moodlewsrestformat');
        const courseid = params.get('courseids[0]') || params.get('amp;courseids[0]') || params.get('courseids[]') || params.get('courseids');
        setCourseId(courseid);
        const assignmentid = params.get('assignmentid') || params.get('amp;assignmentid');
        const parsedCmid = params.get('cmid') || params.get('amp;cmid');

        setAssignmentId(assignmentid);
        setCmid(parsedCmid);
        console.log("rawSearch:", window.location.search);
        console.log("storageToken:", sessionStorage.getItem("chatbot_token"));
        console.log("urlToken:", urlToken);
        console.log('Final wstoken:', wstoken);
        setCmid(parsedCmid);

        console.log("parsedCmid:", parsedCmid);
        console.log("courseid:", courseid);
        console.log("assignmentid:", assignmentid);

        if (!wstoken || !courseid) {
          console.warn('Moodle params missing in AnalysisCodePage, skip REST call', { wstoken, courseid });
          setLoading(false);
          setError('Thiếu token hoặc course id trong URL, không thể tải mã nguồn.');
          return;
        }

        // get userId via moodleApi.getUserInfo (same as Chatbot.jsx)
        let resolvedUserId = null;
        try {
          const ui = await moodleApi.getUserInfo();
          console.log('User info response:', ui);
          resolvedUserId = ui.userid || ui.id || ui.user?.id || ui.user?.userid;
          if (resolvedUserId) {
            setUserId(resolvedUserId);
          }
        } catch (err) {
          console.warn('Could not fetch user info:', err);
        }

        console.log("resolvedUserId:", resolvedUserId);

        const apiParams = {
          wstoken,
          'assignmentids[0]': assignmentid,
          userId: resolvedUserId,
        };

        const responseData = await chatbotApi.getSubmittedCode(apiParams);

        // Parse response - it's now a JSON array of file objects
        let fileMetadata = [];
        try {
          if (typeof responseData === 'string') {
            fileMetadata = JSON.parse(responseData);
          } else {
            fileMetadata = responseData;
          }
        } catch (parseErr) {
          console.error('Failed to parse file metadata:', parseErr);
          setError('Không thể parse dữ liệu file. Định dạng không hợp lệ.');
          setLoading(false);
          return;
        }

        if (!Array.isArray(fileMetadata) || fileMetadata.length === 0) {
          setFiles([]);
          setAnalysis(null);
          setActiveIndex(0);
          setError(null);
          setLoading(false);
          return;
        }

        // Fetch content for each file
        const filesWithContent = await Promise.all(
          fileMetadata.map(async (fileMeta) => {
            try {
              const fileUrl = `${fileMeta.url}?token=${wstoken}`;
              const contentResponse = await fetch(fileUrl);
              if (!contentResponse.ok) {
                console.warn(`Failed to fetch file ${fileMeta.name}:`, contentResponse.status);
                return { name: fileMeta.name, code: `[Error: Could not load file - ${contentResponse.status}]` };
              }
              let code = await contentResponse.text();
              return { name: fileMeta.name, code };
            } catch (err) {
              console.error(`Error fetching file ${fileMeta.name}:`, err);
              return { name: fileMeta.name, code: `[Error: ${err.message}]` };
            }
          })
        );

        setFiles(filesWithContent);
        setActiveIndex(0);

        // Fetch analysis result for the assignment
        try {
          const analysisResp = await chatbotApi.analyzeSubmittedCode(
            {
              courseId: courseid,
              assignmentId: assignmentid,
              cmid: parsedCmid,
              userId: resolvedUserId,
            }
          );
          let parsedAnalysis = null;
          try {
            parsedAnalysis = typeof analysisResp === 'string' ? JSON.parse(analysisResp) : analysisResp;
          } catch (e) {
            console.warn('Could not parse analysis response:', e);
            parsedAnalysis = analysisResp;
          }
          setAnalysis(parsedAnalysis);
          console.log('Analysis result:', parsedAnalysis);
        } catch (e) {
          console.warn('Analysis API failed:', e);
        }
      } catch (err) {
        console.error(err);
        setError("Không thể lấy mã nguồn. Kiểm tra console.");
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);



  const activeFile = files[activeIndex] || null;
  const fileAnalysis = analysis && Array.isArray(analysis.files) ? analysis.files.find(f => f.fileName === activeFile?.name) : null;
  const projectRelationshipFeedback = analysis?.projectRelationshipFeedback || null;

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-100 text-slate-900">
      <div
        className={`h-full min-h-0 relative overflow-hidden bg-slate-50 transition-all duration-300 ease-in-out ${analysisSidebarOpen
          ? "w-[60%] min-w-md border-r border-slate-200"
          : "w-0 min-w-0"
          }`}
      >
        {analysisSidebarOpen && (
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => setAnalysisSidebarOpen(false)}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 shadow-sm hover:bg-slate-100"
            >
              ⬌
            </button>
          </div>
        )}

        <div
          className={`h-full overflow-hidden transition-opacity duration-300 ${analysisSidebarOpen ? "opacity-100" : "opacity-0"
            }`}
        >
          <div className="px-6 w-full h-full flex flex-col overflow-hidden">
            {loading && <div className="text-sm text-slate-600">Đang tải mã nguồn...</div>}
            {error && <div className="text-sm text-red-600">{error}</div>}

            {!loading && files.length > 0 && (
              <>
                <CodeFileTabs files={files} activeIndex={activeIndex} onChange={setActiveIndex} />
                <div className="-mx-6 flex-1 min-h-0 flex flex-col overflow-hidden">
                  <div ref={wrapperRef} className="w-full flex-1 min-h-0 flex flex-col overflow-hidden">
                    {/* Code Viewer */}
                    <div style={{ height: `${codeHeight}px` }} className="w-full flex-shrink-0">
                      <SourceCodeViewer
                        code={activeFile?.code || ""}
                        language={detectLanguageFromName(activeFile?.name)}
                        startingLineNumber={1}
                        syntaxStatus={fileAnalysis?.fileMemory?.syntaxStatus}
                      />
                    </div>

                    {/* Draggable Divider */}
                    <div
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                        const startY = e.clientY;
                        const startHeight = codeHeight;
                        const onMouseMove = (moveEvent) => {
                          if (!wrapperRef.current) return;
                          const rect = wrapperRef.current.getBoundingClientRect();
                          const deltaY = moveEvent.clientY - startY;
                          const newHeight = Math.max(120, Math.min(rect.height - 80, startHeight + deltaY));
                          setCodeHeight(newHeight);
                        };
                        const onMouseUp = () => {
                          setIsDragging(false);
                          document.removeEventListener("mousemove", onMouseMove);
                          document.removeEventListener("mouseup", onMouseUp);
                        };
                        document.addEventListener("mousemove", onMouseMove);
                        document.addEventListener("mouseup", onMouseUp);
                      }}
                      className="h-2 flex-shrink-0 cursor-row-resize bg-slate-300 hover:bg-blue-400 transition-colors"
                      style={{ display: "block" }}
                    />

                    {/* Analysis Panel */}
                    <div className="w-full flex-1 min-h-0 pl-6 py-3 overflow-hidden">
                      <div className="rounded-md bg-white text-xs text-slate-800 text-left h-full overflow-y-auto">
                        <h3 className="font-semibold mb-2 text-sm">Phân tích tệp</h3>
                        {fileAnalysis ? (
                          <div>
                            {fileAnalysis.fileMemory?.syntaxStatus && (
                              <div
                                className="mb-3 p-2 rounded bg-slate-50 border-l-4"
                                style={{
                                  borderLeftColor:
                                    fileAnalysis.fileMemory.syntaxStatus.status === "ERROR"
                                      ? "#ef4444"
                                      : "#eab308",
                                }}
                              >
                                <div className="text-left text-xs">
                                  <strong
                                    style={{
                                      color:
                                        fileAnalysis.fileMemory.syntaxStatus.status === "ERROR"
                                          ? "#ef4444"
                                          : "#eab308",
                                    }}
                                  >
                                    {fileAnalysis.fileMemory.syntaxStatus.status === "ERROR"
                                      ? "❌ LỖI SYNTAX"
                                      : "⚠️ CẢNH BÁO"}
                                  </strong>
                                </div>
                                <div className="text-left text-xs mt-1 text-slate-700">
                                  <strong>Loại lỗi:</strong>{" "}
                                  {fileAnalysis.fileMemory.syntaxStatus.errorType}
                                </div>
                                <div className="text-left text-xs mt-1 text-slate-700 wrap-break-word">
                                  <strong>Token:</strong>{" "}
                                  <code className="bg-slate-100 px-1 rounded">
                                    {fileAnalysis.fileMemory.syntaxStatus.errorToken}
                                  </code>
                                </div>
                                <div className="text-left text-xs mt-1 text-slate-700 break-words">
                                  <strong>Chi tiết:</strong>{" "}
                                  <MarkdownMessage
                                    inline
                                    content={fileAnalysis.fileMemory.syntaxStatus.message}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="mb-2 text-left text-xs">
                              <strong>Đánh giá:</strong> {fileAnalysis.rating}
                            </div>
                            <div className="mb-2 text-left text-xs break-words">
                              <strong>Tóm tắt:</strong>{" "}
                              <MarkdownMessage
                                inline
                                content={fileAnalysis.shortFeedback}
                              />
                            </div>
                            <div className="mb-2 text-left text-xs">
                              <strong>Vấn đề chính:</strong>
                              <div className="mt-1">
                                <MarkdownMessage
                                  content={
                                    fileAnalysis.mainIssues?.length > 0
                                      ? fileAnalysis.mainIssues.map((m) => `- ${m}`).join("\n")
                                      : "Không có"
                                  }
                                />
                              </div>
                            </div>
                            <div className="mb-2 text-left text-xs">
                              <strong>Đề xuất cải thiện:</strong>
                              <div className="mt-1">
                                <MarkdownMessage
                                  content={
                                    fileAnalysis.improvementSuggestions?.length > 0
                                      ? fileAnalysis.improvementSuggestions.map((s) => `- ${s}`).join("\n")
                                      : "Không có"
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        ) : analysis ? (
                          <div className="text-slate-500">Không có phân tích cho file này.</div>
                        ) : (
                          <div className="text-slate-500">Đang tải phân tích...</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!loading && files.length === 0 && (
              <div className="flex flex-col items-start gap-4 py-6 text-sm text-slate-700">
                <div>
                  Bạn chưa nộp bài tập lên hệ thống. Bạn có thể chọn file từ máy để AI phân tích thử trước khi nộp.
                </div>

                {/* Khu vực kéo thả */}
                <label
                  className={`w-full cursor-pointer rounded-lg border-2 border-dashed p-6 transition
    ${isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-300 bg-slate-50 hover:border-blue-400"
                    }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleSelectDraftFiles}
                  />

                  {draftFiles.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 11v8m0-8l-3 3m3-3l3 3"
                        />
                      </svg>

                      <div className="font-medium">
                        Thêm các tập tin bằng cách kéo thả.
                      </div>

                      <div className="text-xs text-slate-500">
                        Hoặc nhấn để chọn file từ máy tính
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-3 font-medium">
                        Đã chọn {draftFiles.length} file:
                      </div>

                      <ul className="space-y-2">
                        {draftFiles.map((file, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between rounded border border-slate-200 bg-white px-3 py-2"
                          >
                            <span className="truncate">{file.name}</span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault(); // tránh click vào label mở hộp chọn file
                                e.stopPropagation();
                                handleRemoveDraftFile(index);
                              }}
                              className="ml-3 rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-3 text-xs text-slate-500">
                        Nhấn hoặc kéo thả để thêm file khác
                      </div>
                    </div>
                  )}
                </label>

                <button type="button" onClick={handleAnalyzeDraftFiles} disabled={draftFiles.length === 0 || analyzingDraft} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400 hover:bg-blue-700" >
                  {analyzingDraft ? "Đang phân tích..." : "Phân tích file đã chọn"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative h-full flex-1 bg-slate-50 overflow-hidden">
        {!analysisSidebarOpen && (
          <div className="absolute left-4 top-4 z-20">
            <button
              onClick={() => setAnalysisSidebarOpen(true)}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 shadow-sm hover:bg-slate-100"
            >
              ⬌
            </button>
          </div>
        )}

        <ChatAnalysisPanel
          title={"Chatbot phân tích và cải thiện mã nguồn"}
          courseId={courseId}
          assignmentId={assignmentId}
          cmid={cmid}
          userId={userId}
          isDraftAnalysis={isDraftAnalysis}
          projectRelationshipFeedback={projectRelationshipFeedback}
        />
      </div>
    </div>
  );
}

const detectLanguageFromName = (fileName = "") => {
  const ext = fileName.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "java":
      return "java";

    case "py":
      return "python";

    case "cpp":
    case "cc":
    case "cxx":
    case "hpp":
    case "h":
      return "cpp";

    case "html":
    case "htm":
      return "html";

    case "php":
      return "php";

    case "css":
      return "css";

    case "js":
    case "jsx":
      return "javascript";

    default:
      return "text";
  }
};

export default AnalysisCodePage;
