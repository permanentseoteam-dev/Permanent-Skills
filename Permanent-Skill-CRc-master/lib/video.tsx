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
  return { type: "file" as const, src: value };
}

export function renderNotes(notes: string) {
  const lines = notes.split("\n");
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-3" />;
    if (trimmed.startsWith("IMPORTANT:")) {
      return (
        <p key={i} className="font-semibold text-zinc-900">
          <span className="font-bold">IMPORTANT:</span> {linkify(trimmed.replace(/^IMPORTANT:\s*/i, ""))}
        </p>
      );
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      return (
        <li key={i} className="ml-5 list-disc text-zinc-700">
          {linkify(trimmed.slice(2))}
        </li>
      );
    }
    return (
      <p key={i} className="text-zinc-700">
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
        <a key={i} href={md[2]} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
          {md[1]}
        </a>
      );
    }
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={i} href={part} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
