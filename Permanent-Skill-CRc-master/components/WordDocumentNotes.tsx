"use client";

import { useEffect, useState } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  Copy,
  Download,
  FileText,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Save,
  Search,
  Share2,
  Strikethrough,
  Subscript,
  Superscript,
  Type,
  Underline,
  User,
} from "lucide-react";

interface WordDocumentNotesProps {
  lessonId: string;
  lessonTitle: string;
}

export function WordDocumentNotes({ lessonId, lessonTitle }: WordDocumentNotesProps) {
  const storageKey = `pss_word_notes_${lessonId}`;

  const [notes, setNotes] = useState<string>("");
  const [activeTab, setActiveTab] = useState("Home");
  const [fontSize, setFontSize] = useState("11");
  const [fontFamily, setFontFamily] = useState("Calibri (Body)");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrike, setIsStrike] = useState(false);
  const [alignment, setAlignment] = useState<"left" | "center" | "right" | "justify">("left");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load saved notes for this lesson from localStorage
  useEffect(() => {
    try {
      const savedText = localStorage.getItem(storageKey);
      if (savedText !== null) {
        setNotes(savedText);
      } else {
        setNotes("");
      }
    } catch {
      setNotes("");
    }
  }, [storageKey]);

  // Handle note changes
  function handleNotesChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setNotes(val);
    try {
      localStorage.setItem(storageKey, val);
    } catch {
      // ignore
    }
  }

  function handleSave() {
    try {
      localStorage.setItem(storageKey, notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([notes], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${lessonTitle.replace(/[^a-z0-9]/gi, "_")}_Notes.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;
  const charCount = notes.length;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-300/90 bg-[#f3f4f6] shadow-sm select-none">
      {/* 1. Word Ribbon Menu Tabs & Action Buttons */}
      <div className="flex items-center justify-between bg-[#f3f4f6] px-2 pt-1 border-b border-zinc-200 text-xs">
        <div className="flex items-center gap-1 overflow-x-auto">
          {["File", "Home", "Insert", "Draw", "Design", "Layout", "References", "Review", "View", "Help"].map(
            (tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "border-b-2 border-[#185abd] bg-white font-bold text-zinc-900 shadow-2xs rounded-t"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 rounded"
                  }`}
                >
                  {tab}
                </button>
              );
            }
          )}
        </div>

        {/* Action Buttons: Save, Download, Copy */}
        <div className="flex items-center gap-1.5 pb-1 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1 rounded bg-white hover:bg-zinc-100 border border-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 transition shadow-2xs cursor-pointer"
            title="Save Notes"
          >
            {saved ? <Check size={12} className="text-emerald-600" /> : <Save size={12} />}
            <span>{saved ? "Saved" : "Save"}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1 rounded bg-white hover:bg-zinc-100 border border-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 transition shadow-2xs cursor-pointer"
            title="Download Notes (.txt)"
          >
            <Download size={12} />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded bg-white hover:bg-zinc-100 border border-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 transition shadow-2xs cursor-pointer"
            title="Copy all notes to clipboard"
          >
            {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
            <span className="hidden sm:inline">Copy</span>
          </button>
        </div>
      </div>

      {/* 3. Word Ribbon Toolbar (Home Tab) */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-2 border-b border-zinc-200 text-zinc-700 shadow-2xs">
        {/* Font Group */}
        <div className="flex items-center gap-1.5 border-r border-zinc-200 pr-3">
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-800 outline-none hover:border-zinc-300 cursor-pointer"
          >
            <option value="Calibri (Body)">Calibri (Body)</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Segoe UI">Segoe UI</option>
            <option value="Consolas">Consolas (Code)</option>
          </select>

          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="rounded border border-zinc-200 bg-white px-1.5 py-1 text-xs text-zinc-800 outline-none hover:border-zinc-300 cursor-pointer"
          >
            <option value="10">10</option>
            <option value="11">11</option>
            <option value="12">12</option>
            <option value="14">14</option>
            <option value="16">16</option>
            <option value="18">18</option>
          </select>

          <div className="flex items-center gap-0.5 ml-1">
            <button
              type="button"
              onClick={() => setIsBold(!isBold)}
              className={`rounded p-1 transition cursor-pointer ${
                isBold ? "bg-[#185abd]/15 text-[#185abd] font-bold" : "hover:bg-zinc-100 text-zinc-700"
              }`}
              title="Bold (Ctrl+B)"
            >
              <Bold size={14} />
            </button>
            <button
              type="button"
              onClick={() => setIsItalic(!isItalic)}
              className={`rounded p-1 transition cursor-pointer ${
                isItalic ? "bg-[#185abd]/15 text-[#185abd]" : "hover:bg-zinc-100 text-zinc-700"
              }`}
              title="Italic (Ctrl+I)"
            >
              <Italic size={14} />
            </button>
            <button
              type="button"
              onClick={() => setIsUnderline(!isUnderline)}
              className={`rounded p-1 transition cursor-pointer ${
                isUnderline ? "bg-[#185abd]/15 text-[#185abd]" : "hover:bg-zinc-100 text-zinc-700"
              }`}
              title="Underline (Ctrl+U)"
            >
              <Underline size={14} />
            </button>
            <button
              type="button"
              onClick={() => setIsStrike(!isStrike)}
              className={`rounded p-1 transition cursor-pointer ${
                isStrike ? "bg-[#185abd]/15 text-[#185abd]" : "hover:bg-zinc-100 text-zinc-700"
              }`}
              title="Strikethrough"
            >
              <Strikethrough size={14} />
            </button>
          </div>
        </div>

        {/* Paragraph & Alignment Group */}
        <div className="flex items-center gap-1 border-r border-zinc-200 pr-3">
          <button
            type="button"
            onClick={() => setAlignment("left")}
            className={`rounded p-1 transition cursor-pointer ${
              alignment === "left" ? "bg-[#185abd]/15 text-[#185abd]" : "hover:bg-zinc-100 text-zinc-700"
            }`}
            title="Align Left"
          >
            <AlignLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => setAlignment("center")}
            className={`rounded p-1 transition cursor-pointer ${
              alignment === "center" ? "bg-[#185abd]/15 text-[#185abd]" : "hover:bg-zinc-100 text-zinc-700"
            }`}
            title="Align Center"
          >
            <AlignCenter size={14} />
          </button>
          <button
            type="button"
            onClick={() => setAlignment("right")}
            className={`rounded p-1 transition cursor-pointer ${
              alignment === "right" ? "bg-[#185abd]/15 text-[#185abd]" : "hover:bg-zinc-100 text-zinc-700"
            }`}
            title="Align Right"
          >
            <AlignRight size={14} />
          </button>
          <button
            type="button"
            onClick={() => setAlignment("justify")}
            className={`rounded p-1 transition cursor-pointer ${
              alignment === "justify" ? "bg-[#185abd]/15 text-[#185abd]" : "hover:bg-zinc-100 text-zinc-700"
            }`}
            title="Justify"
          >
            <AlignJustify size={14} />
          </button>
        </div>

        {/* Quick Styles Gallery (Normal, No Spacing, Heading 1) */}
        <div className="hidden sm:flex items-center gap-1 border-r border-zinc-200 pr-3">
          <div className="rounded border border-[#185abd] bg-[#185abd]/10 px-2 py-0.5 text-center">
            <span className="block text-[10px] font-bold text-[#185abd]">AaBbCcDc</span>
            <span className="block text-[9px] text-zinc-600">Normal</span>
          </div>
          <div className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-center hover:bg-zinc-100 cursor-pointer">
            <span className="block text-[10px] font-medium text-zinc-800">AaBbCcDc</span>
            <span className="block text-[9px] text-zinc-500">No Spacing</span>
          </div>
          <div className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-center hover:bg-zinc-100 cursor-pointer">
            <span className="block text-[10px] font-bold text-[#185abd]">AaBbCcDc</span>
            <span className="block text-[9px] text-zinc-500">Heading 1</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded border border-zinc-200 bg-white hover:bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 transition cursor-pointer shadow-2xs"
            title="Copy all notes"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* 4. Word Margin Ruler */}
      <div className="hidden sm:flex items-center justify-between bg-[#e5e7eb] px-12 py-0.5 text-[9px] font-mono text-zinc-500 border-b border-zinc-300 select-none">
        <div className="flex items-center justify-between w-full max-w-3xl mx-auto px-4">
          <span>1</span>
          <span>·</span>
          <span>2</span>
          <span>·</span>
          <span>3</span>
          <span>·</span>
          <span>4</span>
          <span>·</span>
          <span>5</span>
          <span>·</span>
          <span>6</span>
          <span>·</span>
          <span>7</span>
          <span>·</span>
          <span>8</span>
        </div>
      </div>

      {/* 5. Document Canvas (White Page styled like Microsoft Word) */}
      <div className="bg-[#eef1f5] p-3 sm:p-6 md:p-8 flex justify-center">
        <div className="w-full max-w-3xl min-h-[380px] md:min-h-[460px] rounded bg-white p-6 sm:p-10 md:p-14 shadow-md border border-zinc-300/80 flex flex-col justify-between">
          <textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder="Type your lesson notes, action items, takeaways, and questions here... (Auto-saves automatically)"
            style={{
              fontWeight: isBold ? "bold" : "normal",
              fontStyle: isItalic ? "italic" : "normal",
              textDecoration: isUnderline ? "underline" : isStrike ? "line-through" : "none",
              textAlign: alignment,
              fontSize: `${fontSize}pt`,
              fontFamily: fontFamily.split(" ")[0],
            }}
            className="w-full flex-1 resize-none bg-transparent outline-none text-zinc-900 placeholder:text-zinc-400 placeholder:italic leading-relaxed min-h-[300px]"
          />
        </div>
      </div>

      {/* 6. Word Status Bar at Bottom */}
      <div className="flex flex-wrap items-center justify-between bg-[#f3f4f6] px-3 py-1 text-[11px] text-zinc-600 border-t border-zinc-300">
        <div className="flex items-center gap-3">
          <span>Page 1 of 1</span>
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
          <span className="hidden sm:inline">English (United States)</span>
          <span className="hidden md:inline text-emerald-700 font-medium">✓ Accessibility: Good to go</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-400">Word Document Notes</span>
          <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-500">
            <span>-</span>
            <span>100%</span>
            <span>+</span>
          </div>
        </div>
      </div>
    </div>
  );
}
