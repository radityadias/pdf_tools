export type AcceptRule = {
  /** Singular noun used in messages and default labels, e.g. "PDF", "image" */
  noun: string;
  /** Exact MIME types or wildcards like "image/*" */
  mimeTypes: string[];
  /** Fallback when the browser reports an empty or odd MIME type (lowercase, no dot) */
  extensions: string[];
  /** MIME types to refuse even when a wildcard matches */
  exclude?: string[];
};

export const PDF_FILES: AcceptRule = {
  noun: "PDF",
  mimeTypes: ["application/pdf"],
  extensions: ["pdf"],
};

export const IMAGE_FILES: AcceptRule = {
  noun: "image",
  mimeTypes: ["image/*"],
  extensions: ["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"],
  exclude: ["image/svg+xml"],
};

const matchesMime = (type: string, pattern: string) =>
  pattern.endsWith("/*") ? type.startsWith(pattern.slice(0, -1)) : type === pattern;

export function matchesAccept(file: File, rule: AcceptRule): boolean {
  const type = file.type.toLowerCase();
  if (type && rule.exclude?.some((p) => matchesMime(type, p))) return false;
  if (type && rule.mimeTypes.some((p) => matchesMime(type, p))) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return rule.extensions.includes(ext);
}

/** Value for the <input accept="..."> attribute */
export function acceptAttribute(rule: AcceptRule): string {
  return [...rule.mimeTypes, ...rule.extensions.map((e) => `.${e}`)].join(",");
}

export type FilterOptions = {
  accept: AcceptRule;
  multiple: boolean;
  /** Most files that may be accepted in this selection (e.g. remaining free slots) */
  maxFiles?: number;
  maxSizeMB?: number;
};

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function filterFiles(
  incoming: File[],
  { accept, multiple, maxFiles, maxSizeMB }: FilterOptions
): { accepted: File[]; message: string | null } {
  const notes: string[] = [];

  let files = incoming.filter((f) => matchesAccept(f, accept));
  const wrongType = incoming.length - files.length;
  if (wrongType > 0) {
    notes.push(
      incoming.length === 1
        ? `Please choose a ${accept.noun} file.`
        : `${wrongType} ${plural(wrongType, "file was", "files were")} skipped because ${plural(wrongType, "it is", "they are")} not ${accept.noun} files.`
    );
  }

  if (maxSizeMB !== undefined) {
    const limit = maxSizeMB * 1_048_576;
    const tooBig = files.filter((f) => f.size > limit).length;
    if (tooBig > 0) {
      files = files.filter((f) => f.size <= limit);
      notes.push(
        `${tooBig} ${plural(tooBig, "file is", "files are")} over ${maxSizeMB} MB and ${plural(tooBig, "was", "were")} skipped.`
      );
    }
  }

  if (!multiple) {
    files = files.slice(0, 1);
  } else if (maxFiles !== undefined && files.length > maxFiles) {
    notes.push(
      maxFiles <= 0
        ? "Limit reached: no more files can be added."
        : `Limit reached: only ${maxFiles} more ${plural(maxFiles, "file was", "files were")} added.`
    );
    files = files.slice(0, Math.max(0, maxFiles));
  }

  return { accepted: files, message: notes.length ? notes.join(" ") : null };
}