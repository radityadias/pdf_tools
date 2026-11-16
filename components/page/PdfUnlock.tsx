"use client";

import { useEffect, useRef, useState } from "react";
import ActionButton from "@/components/layout/ActionButton";
import FileBar from "@/components/layout/FileBar";
import FileDropzone from "@/components/layout/FileDropzone";
import PasswordField from "@/components/layout/PasswordField";
import ResultCard from "@/components/layout/ResultCard";
import { useProtection } from "@/hooks/useProtection";
import { PDF_FILES } from "@/lib/files";
import { formatBytes as fmt } from "@/lib/format";
import { MAX_FILE_MB, unlockPdf, WrongPasswordError } from "@/services/qpdf";

export default function PdfUnlock() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [allowed, setAllowed] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    url: string;
    filename: string;
    size: number;
  } | null>(null);
  const [askPassword, setAskPassword] = useState(false);

  const urlRef = useRef<string | null>(null);

  const protection = useProtection(file);
  const stem = file ? file.name.replace(/\.pdf$/i, "") : "file";
  const needsPassword = protection === "needs-password" || askPassword;

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
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
    setAskPassword(false);
    setPassword("");
    setPasswordError(null);
    setVisible(false);
    setAllowed(false);
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

  const ready =
    !!file &&
    protection !== null &&
    protection !== "checking" &&
    protection !== "failed";
  const canUnlock =
    ready &&
    protection !== "none" &&
    allowed &&
    (!needsPassword || password.length > 0);

  async function handleUnlock() {
    if (!file || !canUnlock) return;

    setBusy(true);
    setError(null);
    setPasswordError(null);
    clearResult();

    try {
      const blob = await unlockPdf(file, password || undefined);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setResult({ url, filename: `${stem}-unlocked.pdf`, size: blob.size });
    } catch (e) {
      if (e instanceof WrongPasswordError) {
        setAskPassword(true);
        setPasswordError(
          password ? e.message : "This PDF needs a password. Enter it above.",
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

      {ready && protection === "none" && (
        <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          This PDF isn&apos;t protected, so there&apos;s nothing to unlock.
        </p>
      )}

      {ready && protection === "open" && (
        <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          This PDF opens without a password but has restrictions, such as limits
          on printing, copying or editing. Unlocking creates a copy without
          them.
        </p>
      )}

      {ready && protection === "unknown" && (
        <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          We couldn&apos;t tell whether this PDF is protected. You can still
          try, and enter the password below if it has one.
        </p>
      )}

      {ready && (needsPassword || protection === "unknown") && (
        <PasswordField
          id="unlock-password"
          label={needsPassword ? "Password" : "Password (if it has one)"}
          value={password}
          onChange={(v) => {
            clearResult();
            setPasswordError(null);
            setPassword(v);
          }}
          visible={visible}
          onToggleVisible={() => setVisible((v) => !v)}
          autoComplete="current-password"
          disabled={busy}
          error={passwordError}
          hint={
            needsPassword
              ? "Enter the password you use to open this PDF. This tool can't guess or crack passwords."
              : undefined
          }
        />
      )}

      {ready && protection !== "none" && (
        <>
          <label className="flex items-start gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={allowed}
              onChange={(e) => setAllowed(e.target.checked)}
              disabled={busy}
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span>
              I own this file, or I have permission to remove its protection.
            </span>
          </label>

          <ActionButton
            label="Unlock PDF"
            busyLabel="Unlocking…"
            busy={busy}
            disabled={!canUnlock}
            onClick={handleUnlock}
          />
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
            Your PDF is unlocked{" "}
            <span className="text-muted-foreground">({fmt(result.size)})</span>
          </ResultCard>
          <p className="text-center text-sm text-muted-foreground">
            This is a new copy without protection. Your original file was not
            changed.
          </p>
        </div>
      )}
    </div>
  );
}
