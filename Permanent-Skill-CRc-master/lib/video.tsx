export function getVideoThumbnail(url?: string): string | null {
  if (!url?.trim()) return null;
  const match = url.trim().match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i,
  );
  if (match) {
    return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }
  return null;
}

export function toEmbed(url?: string) {
  if (!url?.trim()) return null;
  const value = url.trim();
  const youtube = value.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i,
  );
  if (youtube) {
    return { type: "youtube" as const, src: `https://www.youtube.com/embed/${youtube[1]}` };
  }
  const vimeo = value.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) {
    return { type: "vimeo" as const, src: `https://player.vimeo.com/video/${vimeo[1]}` };
  }
  const loom = value.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/i);
  if (loom) {
    return { type: "loom" as const, src: `https://www.loom.com/embed/${loom[1]}` };
  }
  const gdrive = value.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (gdrive) {
    return { type: "gdrive" as const, src: `https://drive.google.com/file/d/${gdrive[1]}/preview` };
  }
  return { type: "file" as const, src: value };
}

export function renderNotes(notes: string) {
  const lines = notes.split("\n");
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-4" />;

    // Bold heading lines matching Image 1
    if (
      trimmed.startsWith("Welcome everyone") ||
      trimmed.startsWith("A few recommendations") ||
      trimmed.startsWith("What's the catch?") ||
      trimmed.startsWith("PASSWORD:") ||
      trimmed.startsWith("IMPORTANT:") ||
      trimmed.startsWith("Figma file with slides")
    ) {
      if (trimmed.startsWith("What's the catch?")) {
        return (
          <p key={i} className="text-zinc-800 font-normal leading-relaxed">
            <strong className="font-bold text-zinc-900">What&apos;s the catch?</strong>{" "}
            {linkify(trimmed.replace(/^What's the catch\?\s*/i, ""))}
          </p>
        );
      }
      if (trimmed.startsWith("PASSWORD:")) {
        return (
          <p key={i} className="text-zinc-900 font-bold tracking-wide">
            {trimmed}
          </p>
        );
      }
      if (trimmed.startsWith("IMPORTANT:")) {
        return (
          <p key={i} className="font-semibold text-zinc-900">
            <span className="font-bold">IMPORTANT:</span> {linkify(trimmed.replace(/^IMPORTANT:\s*/i, ""))}
          </p>
        );
      }
      return (
        <p key={i} className="font-bold text-zinc-900 text-[15px] leading-snug">
          {linkify(trimmed)}
        </p>
      );
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      return (
        <li key={i} className="ml-5 list-disc text-zinc-800 leading-relaxed pl-1 my-1">
          {linkify(trimmed.replace(/^[-•]\s*/, ""))}
        </li>
      );
    }

    return (
      <p key={i} className="text-zinc-800 leading-relaxed">
        {linkify(trimmed)}
      </p>
    );
  });
}

function linkify(text: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s]+)/g);
  return parts.map((part, i) => {
    const md = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (md) {
      return (
        <a key={i} href={md[2]} target="_blank" rel="noreferrer" className="font-semibold text-[#3b82f6] hover:underline break-all">
          {md[1]}
        </a>
      );
    }
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={i} href={part} target="_blank" rel="noreferrer" className="font-semibold text-[#3b82f6] hover:underline break-all">
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
