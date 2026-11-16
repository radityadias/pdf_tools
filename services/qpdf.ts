import { EncryptedPDFError, PDFDocument } from "pdf-lib";
import { generatePassword } from "@/lib/password";

export type Protection = "none" | "open" | "needs-password" | "unknown";
export type KeyLength = 128 | 256;
export type Permissions = { print: boolean; copy: boolean; edit: boolean };

export const MAX_FILE_MB = 100;
export const MAX_PASSWORD_BYTES = 127;
export const MIN_PASSWORD_LENGTH = 6;

const WASM_URL = "/qpdf/qpdf.wasm";
const IN = "/in.pdf";
const OUT = "/out.pdf";
const ENGINE_ERROR = "Could not load the PDF engine. Reload the page and try again.";

export class WrongPasswordError extends Error {
  constructor(message = "That password is incorrect.") {
    super(message);
    this.name = "WrongPasswordError";
  }
}

type QpdfModule = {
  FS: {
    writeFile(path: string, data: Uint8Array): void;
    readFile(path: string): Uint8Array;
  };
  callMain(args: string[]): number | void;
};
type Factory = (options: Record<string, unknown>) => Promise<QpdfModule>;

/** code is the exit status, or -1 when the engine didn't report one */
type Run = { code: number; stderr: string; output: Uint8Array | null };

async function run(input: Uint8Array, args: string[]): Promise<Run> {
  let createModule: Factory;
  try {
    createModule = (await import("@neslinesli93/qpdf-wasm")).default as unknown as Factory;
  } catch {
    throw new Error(ENGINE_ERROR);
  }

  const stderr: string[] = [];

  // This build ignores the print options and writes to the console. Emscripten binds its
  // output functions when the module starts, so capture them for that moment only.
  const originalError = console.error;
  const originalLog = console.log;
  console.error = (...a: unknown[]) => {
    stderr.push(a.map(String).join(" "));
  };
  console.log = () => {};

  let starting: Promise<QpdfModule>;
  try {
    starting = createModule({
      locateFile: () => WASM_URL,
      noInitialRun: true, // don't run main() with no arguments on startup
      print: () => {},
      printErr: (line: string) => stderr.push(line),
    });
  } finally {
    console.error = originalError;
    console.log = originalLog;
  }

  let qpdf: QpdfModule;
  try {
    qpdf = await starting;
  } catch {
    throw new Error(ENGINE_ERROR);
  }

  qpdf.FS.writeFile(IN, input);

  let code = -1;
  try {
    const ret = qpdf.callMain(args);
    if (typeof ret === "number") code = ret;
  } catch (e) {
    // Emscripten reports a non-zero exit as an exception carrying the status
    const status = (e as { status?: unknown } | null)?.status;
    if (typeof status === "number") {
      code = status;
    } else {
      code = 2;
      stderr.push(String(e));
    }
  }

  let output: Uint8Array | null = null;
  try {
    output = qpdf.FS.readFile(OUT);
  } catch {
    output = null;
  }

  return { code, stderr: stderr.join("\n"), output };
}

// qpdf exit codes: 0 = success, 3 = success with warnings, 2 = error
const succeeded = (r: Run) =>
  r.output !== null && (r.code === 0 || r.code === 3 || r.code === -1);

const toPdf = (bytes: Uint8Array) =>
  new Blob([new Uint8Array(bytes)], { type: "application/pdf" });

// ---------- Detecting protection (pdf.js + pdf-lib, no qpdf involved) ----------

type OpenResult = "ok" | "needs-password" | "wrong-password" | "error";

async function openWithPdfjs(bytes: Uint8Array, password?: string): Promise<OpenResult> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  // pdf.js hands its input to a worker, which empties the array it is given, so pass a copy
  const task = pdfjs.getDocument({ data: bytes.slice(), password });
  try {
    await task.promise;
    return "ok";
  } catch (e) {
    const err = e as { name?: string; code?: number } | null;
    if (err?.name === "PasswordException") {
      return err.code === 2 ? "wrong-password" : "needs-password";
    }
    return "error";
  } finally {
    await task.destroy();
  }
}

async function detect(bytes: Uint8Array): Promise<Protection> {
  const opened = await openWithPdfjs(bytes);
  if (opened === "needs-password" || opened === "wrong-password") return "needs-password";
  if (opened === "error") return "unknown";

  // It opens without a password. pdf-lib refuses every encrypted file, so if it
  // loads this one it has no protection, and if it refuses, only restrictions remain.
  try {
    await PDFDocument.load(bytes, { updateMetadata: false });
    return "none";
  } catch (e) {
    return e instanceof EncryptedPDFError ? "open" : "unknown";
  }
}

export async function inspectPdf(file: File): Promise<Protection> {
  return detect(new Uint8Array(await file.arrayBuffer()));
}

/** Turns a failed qpdf run into the right error: a password problem or a generic one */
async function failure(
  input: Uint8Array,
  r: Run,
  message: string,
  password?: string
): Promise<Error> {
  const state = await openWithPdfjs(input, password);
  if (state === "needs-password" || state === "wrong-password") {
    return new WrongPasswordError(
      password ? "That password is incorrect." : "This PDF needs a password."
    );
  }
  console.error("qpdf failed:", r.code, r.stderr);
  return new Error(message);
}

// ---------- Protect and unlock ----------

export type ProtectOptions = {
  userPassword: string;
  /** Needed only when the file already has a password */
  currentPassword?: string;
  keyLength: KeyLength;
  permissions: Permissions;
};

export async function protectPdf(file: File, opts: ProtectOptions): Promise<Blob> {
  const { userPassword, currentPassword, keyLength, permissions: p } = opts;

  if (userPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  if (new TextEncoder().encode(userPassword).length > MAX_PASSWORD_BYTES) {
    throw new Error("That password is too long. Use up to 127 characters.");
  }

  // A random owner password makes the permissions below hold even for someone who knows
  // the open password. It is never shown, and it isn't needed to open the file.
  const owner = generatePassword(24);

  const args = [
    ...(currentPassword ? [`--password=${currentPassword}`] : []),
    "--encrypt",
    userPassword,
    owner,
    String(keyLength),
    ...(keyLength === 128 ? ["--use-aes=y"] : []),
    `--print=${p.print ? "full" : "none"}`,
    `--extract=${p.copy ? "y" : "n"}`,
    `--modify=${p.edit ? "all" : "none"}`,
    "--",
    IN,
    OUT,
  ];

  const input = new Uint8Array(await file.arrayBuffer());
  const r = await run(input, args);
  if (!succeeded(r)) {
    throw await failure(input, r, "Could not protect this PDF. It may be damaged.", currentPassword);
  }

  // The result must now ask for a password. Only a clear "no" counts as a failure.
  const state = await detect(r.output!);
  if (state === "none" || state === "open") {
    throw new Error("The protection could not be applied. Please try again.");
  }

  return toPdf(r.output!);
}

export async function unlockPdf(file: File, password?: string): Promise<Blob> {
  const args = [...(password ? [`--password=${password}`] : []), "--decrypt", IN, OUT];

  const input = new Uint8Array(await file.arrayBuffer());
  const r = await run(input, args);
  if (!succeeded(r)) {
    throw await failure(
      input,
      r,
      "Could not unlock this PDF. It may be damaged or use unsupported protection.",
      password
    );
  }

  // The unlocked copy must open with no password and no encryption left
  const state = await detect(r.output!);
  if (state === "needs-password" || state === "open") {
    throw new Error("The PDF could not be unlocked. Please try again.");
  }

  return toPdf(r.output!);
}