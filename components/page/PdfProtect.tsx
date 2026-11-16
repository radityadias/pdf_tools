"use client";

import { useEffect, useRef, useState } from "react";
import ActionButton from "@/components/layout/ActionButton";
import FileBar from "@/components/layout/FileBar";
import FileDropzone from "@/components/layout/FileDropzone";
import OptionCards from "@/components/layout/OptionCards";
import PasswordField from "@/components/layout/PasswordField";
import ResultCard from "@/components/layout/ResultCard";
import { useProtection } from "@/hooks/useProtection";
import { PDF_FILES } from "@/lib/files";
import { formatBytes as fmt } from "@/lib/format";
import { generatePassword } from "@/lib/password";
import {
  MAX_FILE_MB,
  MAX_PASSWORD_BYTES,
  MIN_PASSWORD_LENGTH,
  protectPdf,
  WrongPasswordError,
  type KeyLength,
} from "@/services/qpdf";

const KEY_OPTIONS: { value: KeyLength; title: string; desc: string }[] = [
  { value: 256, title: "AES-256", desc: "Strongest. Recommended" },
  { value: 128, title: "AES-128", desc: "For older PDF software" },
];

const PERMISSIONS = [
  { key: "print", label: "Printing" },
  { key: "copy", label: "Copying text and images" },
  { key: "edit", label: "Editing the document" },
] as const;

export default function PdfProtect() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [current, setCurrent] = useState("");
  const [visible, setVisible] = useState(false);
  const [keyLength, setKeyLength] = useState<KeyLength>(256);
  const [perm, setPerm] = useState({ print: true, copy: true, edit: true });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{
    url: string;
    filename: string;
    size: number;
  } | null>(null);
  const [askCurrent, setAskCurrent] = useState(false);
  const urlRef = useRef<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const protection = useProtection(file);
  const needsCurrent = protection === "needs-password" || askCurrent;
  const stem = file ? file.name.replace(/\.pdf$/i, "") : "file";

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  function clearResult() {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setResult(null);
  }

  function resetFields() {
    clearResult();
    setPassword("");
    setConfirm("");
    setAskCurrent(false);
    setCurrent("");
    setCurrentError(null);
    setVisible(false);
  }

  function pick(files: File[]) {
    resetFields();
    setError(null);
    setFile(files[0]);
  }

  function removeFile() {
    resetFields();
    setError(null);
    setFile(null);
  }

  const bytes = new TextEncoder().encode(password).length;
  const passwordError = !password
    ? null
    : bytes > MAX_PASSWORD_BYTES
      ? "That password is too long. Use up to 127 characters."
      : password.length < MIN_PASSWORD_LENGTH
        ? `Use at least ${MIN_PASSWORD_LENGTH} characters.`
        : null;
  const confirmError =
    confirm && confirm !== password ? "The passwords don't match." : null;

  const ready =
    !!file &&
    protection !== null &&
    protection !== "checking" &&
    protection !== "failed";
  const canProtect =
    ready &&
    password.length >= MIN_PASSWORD_LENGTH &&
    !passwordError &&
    confirm === password &&
    (!needsCurrent || current.length > 0);

  function handleGenerate() {
    const pw = generatePassword(16);
    clearResult();
    setPassword(pw);
    setConfirm(pw);
    setVisible(true); // so the person can see and copy it
  }

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(
        "Could not copy automatically. Select the password and copy it yourself.",
      );
    }
  }

  async function handleProtect() {
    if (!file || !canProtect) return;

    setBusy(true);
    setError(null);
    setCurrentError(null);
    clearResult();

    try {
      const blob = await protectPdf(file, {
        userPassword: password,
        currentPassword: needsCurrent ? current : undefined,
        keyLength,
        permissions: perm,
      });
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setResult({ url, filename: `${stem}-protected.pdf`, size: blob.size });
    } catch (e) {
      if (e instanceof WrongPasswordError) {
        setAskCurrent(true); // reveals the "Current password" field
        setCurrentError(
          current
            ? "That current password is incorrect."
            : "This PDF already has a password. Enter it below.",
        );
      } else {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      <FileDropzone
        accept={PDF_FILES}
        onFiles={pick}
        onError={setError}
        disabled={busy}
        maxSizeMB={MAX_FILE_MB}
        buttonLabel={file ? "Choose another PDF" : "Choose PDF"}
      />

      {file && (
        <FileBar
          file={file}
          state={protection}
          onRemove={removeFile}
          disabled={busy}
        />
      )}

      {protection === "failed" && (
        <p role="alert" className="text-red-600">
          Could not load the PDF engine. Reload the page and try again.
        </p>
      )}

      {ready && (
        <>
          {needsCurrent && (
            <PasswordField
              id="current-password"
              label="Current password"
              value={current}
              onChange={(v) => {
                clearResult();
                setCurrentError(null);
                setCurrent(v);
              }}
              visible={visible}
              onToggleVisible={() => setVisible((v) => !v)}
              autoComplete="current-password"
              disabled={busy}
              hint="This PDF already has a password. Enter it so a new one can be applied."
              error={currentError}
            />
          )}

          {protection === "open" && (
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              This PDF already has restrictions. They will be replaced by the
              settings you choose below.
            </p>
          )}

          <div className="space-y-4">
            <PasswordField
              id="new-password"
              label="Password to open the PDF"
              value={password}
              onChange={(v) => {
                clearResult();
                setPassword(v);
              }}
              visible={visible}
              onToggleVisible={() => setVisible((v) => !v)}
              autoComplete="new-password"
              disabled={busy}
              showStrength
              error={passwordError}
              hint="Longer is stronger. A mix of words, numbers and symbols works well."
            />

            <PasswordField
              id="confirm-password"
              label="Confirm password"
              value={confirm}
              onChange={(v) => {
                clearResult();
                setConfirm(v);
              }}
              visible={visible}
              onToggleVisible={() => setVisible((v) => !v)}
              autoComplete="new-password"
              disabled={busy}
              error={confirmError}
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={busy}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground transition hover:bg-secondary disabled:opacity-50"
              >
                Generate a strong password
              </button>
              <button
                type="button"
                onClick={copyPassword}
                disabled={busy || !password}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground transition hover:bg-secondary disabled:opacity-50"
              >
                {copied ? "Copied!" : "Copy password"}
              </button>
            </div>
          </div>

          <OptionCards
            legend="Encryption"
            name="protect-key"
            options={KEY_OPTIONS}
            value={keyLength}
            onChange={(k) => {
              clearResult();
              setKeyLength(k);
            }}
            disabled={busy}
          />

          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-semibold text-foreground">
              What can people do after opening it?
            </legend>
            {PERMISSIONS.map((p) => (
              <label
                key={p.key}
                className="flex items-center gap-2 text-sm text-foreground"
              >
                <input
                  type="checkbox"
                  checked={perm[p.key]}
                  onChange={(e) => {
                    clearResult();
                    setPerm((prev) => ({ ...prev, [p.key]: e.target.checked }));
                  }}
                  disabled={busy}
                  className="h-4 w-4 accent-primary"
                />
                Allow {p.label.toLowerCase()}
              </label>
            ))}
            <p className="text-sm text-muted-foreground">
              These limits depend on the PDF viewer honouring them. The open
              password is the real protection.
            </p>
          </fieldset>

          <ActionButton
            label="Protect PDF"
            busyLabel="Protecting…"
            busy={busy}
            disabled={!canProtect}
            onClick={handleProtect}
          >
            <p className="text-center text-sm text-muted-foreground">
              Your password is not stored anywhere. If you forget it, the file
              can&apos;t be recovered.
            </p>
          </ActionButton>
        </>
      )}

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-3">
          <ResultCard
            action={{
              type: "link",
              href: result.url,
              filename: result.filename,
              label: "Download PDF",
            }}
          >
            Your PDF is protected{" "}
            <span className="text-muted-foreground">({fmt(result.size)})</span>
          </ResultCard>
          <p className="text-center text-sm text-muted-foreground">
            Open the downloaded file once to confirm it asks for your password,
            and keep the original somewhere safe.
          </p>
        </div>
      )}
    </div>
  );
}
