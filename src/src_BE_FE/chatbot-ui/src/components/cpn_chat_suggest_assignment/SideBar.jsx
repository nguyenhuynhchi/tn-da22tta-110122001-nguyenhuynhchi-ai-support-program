import MarkdownMessage from "./MarkdownMessage";

function SideBar({ info, suggest }) {
  const courseName = info?.fullname || "Chưa có dữ liệu khóa học";
  const assignmentName = info?.assignmentName || "Chưa có dữ liệu bài tập";
  const intro = info?.intro || "Chưa có đề bài";

  const formatContent = (text) => {
    if (!text) return "";
    return text
      // Chuyển \n thành \n\n để tạo paragraph (nhưng không phá vỡ các \n\n đã có)
      .replace(/([^\n])\n([^\n])/g, "$1\n\n$2")
      // fix inline code bị tách dòng
      .replace(/`\s*([^\n`]+?)\s*`/g, "`$1`")
      // fix block code sai format
      .replace(/```(\w*)\s*\n([\s\S]*?)\n```/g, "```$1\n$2\n```");
  };

  const renderSuggestSection = () => {
    if (!suggest) return null;

    const objective = suggest?.objective || null;
    const knowledge = suggest?.knowledge || null;
    const suggestions = suggest?.suggestions || null;
    const commonMistakes = suggest?.commonMistakes || null;

    return (
      <div className="space-y-5">
        {objective && (
          <div>
            <div className="mb-2 text-[20px] font-semibold leading-6 text-slate-900">📋 Mục tiêu</div>
            <MarkdownMessage content={formatContent(objective)} />
          </div>
        )}

        {knowledge && (
          <div>
            <div className="mb-2 text-[20px] font-semibold leading-6 text-slate-900">📚 Kiến thức cần dùng</div>
            <MarkdownMessage content={formatContent(knowledge)} />
          </div>
        )}

        {suggestions && (
          <div>
            <div className="mb-2 text-[20px] font-semibold leading-6 text-slate-900">💡 Gợi ý thực hiện</div>
            <MarkdownMessage content={formatContent(suggestions)} />
          </div>
        )}

        {commonMistakes && (
          <div>
            <div className="mb-2 text-[20px] font-semibold leading-6 text-slate-900">⚠️ Lỗi thường gặp</div>
            <MarkdownMessage content={formatContent(commonMistakes)} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full bg-slate-50 p-4 pt-1 text-left text-[14px] leading-6 text-slate-700">
      <div className="text-[20px] font-semibold leading-7 text-slate-900">Thông tin bài tập</div>

      <div className="mt-1">
        <div className="text-[13px] leading-5 text-slate-600">{courseName} / {assignmentName}</div>
      </div>

      <div className="mt-1 border-t border-slate-200 pt-4 text-[14px] leading-6 text-slate-700">
        <div dangerouslySetInnerHTML={{ __html: intro }} />
      </div>

      <div className="mt-6 text-[20px] font-semibold leading-7 text-slate-900">💡 Gợi ý cách làm</div>
      <div className="mt-3 rounded-md border border-blue-100 border-l-4 border-l-blue-500 bg-blue-50/70 p-4 text-[14px] leading-6 text-slate-800 shadow-sm">
        {renderSuggestSection() || <p>Chưa có gợi ý</p>}
      </div>
    </div>
  );
}

export default SideBar;
