import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const normalizeHeadingLine = (line) => {
  const spacedHeading = line.match(/^(\s{0,3})((?:#\s*){1,6})(.+)$/);
  if (!spacedHeading) return line;

  const [, indent, rawMarker, title] = spacedHeading;
  const level = rawMarker.replace(/\s/g, "").length;
  return `${indent}${"#".repeat(level)} ${title.trimStart()}`;
};

const normalizeMarkdown = (value = "") => {
  const lines = value.replace(/\r\n/g, "\n").split("\n");
  let inFence = false;
  let currentFence = "";

  return lines
    .map((line) => {
      const fenceMatch = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
      if (fenceMatch) {
        const [, indent, fence, rest] = fenceMatch;
        if (!inFence) {
          inFence = true;
          currentFence = fence;
        } else if (currentFence === fence) {
          inFence = false;
          currentFence = "";
        }

        return `${indent}${fence}${rest}`;
      }

      if (inFence) {
        return line;
      }

      const headingMatch = line.match(/^(\s{0,3})(#{1,6})(\s*)(.*)$/);
      if (headingMatch) {
        const [, indent, hashes, , title] = headingMatch;
        return `${indent}${hashes} ${title.trimStart()}`;
      }

      return line;
    })
    .join("\n");
};

const MarkdownMessage = ({ content, inline = false }) => {
  const normalizedContent = normalizeMarkdown(content);

  return (
    <div
      className={
        inline
          ? "inline text-[14px] leading-6 text-slate-800"
          : "max-w-none overflow-x-auto text-left text-[14px] leading-6 text-slate-800"
      }
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props }) {
            const isInline = typeof inline === "boolean" ? inline : !className;
            return !isInline ? (
              <pre className="my-3 overflow-x-auto rounded-md border border-slate-200 !bg-slate-50 px-3 py-2 text-[13px] leading-5 text-slate-800 shadow-inner">
                <code className={`${className || ""} !bg-transparent !p-0 !text-slate-800`} {...props}>{children}</code>
              </pre>
            ) : (
              <code className="rounded-md border border-slate-200 !bg-slate-300 !px-1 !py-0 !leading-none font-mono text-[12px] font-medium !text-slate-800">
                {children}
              </code>
            );
          },
          p({ children }) {
            return inline ? (
              <span className="text-[14px] leading-6">{children}</span>
            ) : (
              <p className="mb-2.5 text-[14px] leading-6">{children}</p>
            );
          },
          ul({ children }) {
            return <ul className="mb-3 ml-5 list-disc space-y-1">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="mb-3 ml-5 list-decimal space-y-1">{children}</ol>;
          },
          li({ children }) {
            return <li className="text-[14px] leading-6">{children}</li>;
          },
          h1({ children }) {
            return (
              <div role="heading" aria-level="1" className="mb-3 mt-4 text-[18px] font-bold leading-7 text-slate-950">
                {children}
              </div>
            );
          },
          h2({ children }) {
            return (
              <div role="heading" aria-level="2" className="mb-2.5 mt-4 text-[17px] font-bold leading-7 text-slate-950">
                {children}
              </div>
            );
          },
          h3({ children }) {
            return (
              <div role="heading" aria-level="3" className="mb-2 mt-3 text-[15px] font-bold leading-6 text-slate-900">
                {children}
              </div>
            );
          },
          h4({ children }) {
            return (
              <div role="heading" aria-level="4" className="mb-2 text-[14px] font-semibold leading-6 text-slate-800">
                {children}
              </div>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-3 border-l-4 border-blue-300 bg-blue-50/70 py-2 pl-3 text-[14px] italic text-slate-700">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="my-3 overflow-x-auto rounded-md border border-slate-200">
                <table className="min-w-full border-collapse text-[13px]">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead className="bg-slate-100">
                {children}
              </thead>
            );
          },
          tbody({ children }) {
            return <tbody>{children}</tbody>;
          },
          tr({ children }) {
            return <tr className="border-b border-slate-200">{children}</tr>;
          },
          th({ children }) {
            return (
              <th className="border-r border-slate-200 px-3 py-2 text-left font-semibold text-slate-800 last:border-r-0">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border-r border-slate-200 px-3 py-2 text-slate-700 last:border-r-0">
                {children}
              </td>
            );
          },
          hr() {
            return <hr className="my-4 border-t border-slate-200" />;
          },
          strong({ children }) {
            return <strong className="font-semibold text-slate-900">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic text-slate-700">{children}</em>;
          },
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownMessage;
