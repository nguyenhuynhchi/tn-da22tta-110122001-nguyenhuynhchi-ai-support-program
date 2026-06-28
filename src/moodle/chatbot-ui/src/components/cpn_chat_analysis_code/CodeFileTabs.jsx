function CodeFileTabs({ files, activeIndex, onChange }) {
  return (
    <div className="flex flex-wrap px-3 py-1 border-b border-slate-200 bg-slate-100">
      {files.map((file, index) => (
        <button
          key={file.name}
          type="button"
          onClick={() => onChange(index)}
          className={`px-2 text-[12px] font-medium border ${
            index === activeIndex
              ? "border-slate-400 text-[14px]"
              : "bg-slate-300 border-slate-300"
          }`}
        >
          {file.name}
        </button>
      ))}
    </div>
  );
}

export default CodeFileTabs;
