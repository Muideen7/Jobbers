"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { deleteAccountAction } from "@/actions/account";

export function DeleteAccountSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (confirmInput.trim().toUpperCase() !== "DELETE") {
      setError("Please type DELETE to confirm");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const res = await deleteAccountAction();
      if (res && res.success) {
        window.location.href = "/login?deleted=1";
        return;
      }
      if (res && !res.success) {
        setError(res.error || "Failed to delete account");
        setIsDeleting(false);
      }
    } catch {
      // Fallback redirect
      window.location.href = "/login?deleted=1";
    }
  }

  return (
    <>
      <section className="rounded-2xl border border-error/30 bg-surface shadow-card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-error/20 bg-error/5 px-6 py-4">
          <Trash2 className="h-4 w-4 text-error" />
          <h2 className="text-sm font-semibold text-error">Danger Zone: Delete Account</h2>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-5">
          <div className="max-w-md">
            <p className="text-sm font-medium text-text-primary">
              Permanently delete your account
            </p>
            <p className="mt-1 text-xs text-text-secondary leading-5">
              Permanently delete your user profile, saved jobs, tailored resumes, and application history. This action cannot be reversed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setConfirmInput("");
              setError(null);
            }}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-error/40 bg-error/10 px-4 py-2.5 text-xs font-semibold text-error transition-all hover:bg-error/15 hover:border-error/60 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            Delete Account
          </button>
        </div>
      </section>

      {/* Confirmation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-error mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-error/10">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Delete Account</h3>
                <p className="text-xs text-text-muted">Permanent & irreversible action</p>
              </div>
            </div>

            <p className="text-sm text-text-secondary leading-6 mb-4">
              This will completely remove your email, password, profile data, all tracked applications, and AI resumes from our database.
            </p>

            <div className="space-y-2 mb-5">
              <label htmlFor="confirm-delete" className="block text-xs font-medium text-text-primary">
                Type <span className="font-bold text-error">DELETE</span> to confirm:
              </label>
              <input
                id="confirm-delete"
                type="text"
                value={confirmInput}
                onChange={(e) => {
                  setConfirmInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="DELETE"
                className="w-full rounded-xl border border-border bg-surface-secondary px-3.5 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-error focus:outline-none focus:ring-1 focus:ring-error"
                disabled={isDeleting}
              />
              {error && <p className="text-xs text-error font-medium">{error}</p>}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isDeleting}
                className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-secondary transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || confirmInput.trim().toUpperCase() !== "DELETE"}
                className="inline-flex items-center gap-2 rounded-xl bg-error px-4 py-2 text-xs font-bold text-accent-foreground hover:bg-error/90 transition-colors cursor-pointer disabled:opacity-40"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    Permanently Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

