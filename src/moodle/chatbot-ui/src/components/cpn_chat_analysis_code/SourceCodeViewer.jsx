import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useEffect, useRef } from "react";
import "./SourceCodeViewer.css";

function SourceCodeViewer({ code, language, startingLineNumber = 1, syntaxStatus }) {
  // Normalize line endings: \r\n -> \n
  const normalizedCode = code?.replace(/\r\n/g, '\n') || '';
  const containerRef = useRef(null);

  // Find error line number
  let errorLineNumber = null;
  if (syntaxStatus?.errorToken) {
    const lines = normalizedCode.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(syntaxStatus.errorToken)) {
        errorLineNumber = i + startingLineNumber;
        break;
      }
    }
  }

  const isWarning = syntaxStatus?.status === "WARNING";
  const isError = syntaxStatus?.status === "ERROR";

  return (
    <div ref={containerRef} className="w-full max-w-full min-w-0 border border-slate-200 bg-slate-950 shadow-sm overflow-hidden h-full">
      <div className="h-full w-full max-w-full min-w-0 overflow-auto syntax-highlighter-container">
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          showLineNumbers={true}
          startingLineNumber={startingLineNumber}
          wrapLines={true}
          lineNumberStyle={{
            display: "inline-block",
            width: "3rem",
            paddingRight: "0.75rem",
            textAlign: "center",
            color: "#94a3b8",
            fontSize: "0.62rem",
            boxSizing: "border-box",
          }}
          customStyle={{
            margin: 0,
            padding: 0,
            borderRadius: 0,
            background: "transparent",
            fontSize: "0.62rem",
            display: "block",
            width: "100%",
            boxSizing: "border-box",
          }}
          codeTagProps={{
            style: {
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              whiteSpace: "pre",
              padding: 0,
              display: "block",
              width: "100%",
              background: "transparent",
              fontSize: "0.62rem",
            },
          }}
          lineProps={(lineNumber) => {
            const isErrorLine = lineNumber === errorLineNumber;

            return {
              "data-line-number": lineNumber,
              className: isErrorLine
                ? isWarning
                  ? "code-warning-line"
                  : "code-error-line"
                : "",
              style: { display: "block" },
            };
          }}
        >
          {normalizedCode}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

export default SourceCodeViewer;
