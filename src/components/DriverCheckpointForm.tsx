"use client";

import { useRef, useState } from "react";
import SignaturePad, { type SignaturePadHandle } from "./SignaturePad";

type CheckpointType = "PICKUP" | "DELIVERY";

export default function DriverCheckpointForm({
  accessCode,
  shipmentId,
  type,
  onDone,
  onCancel,
}: {
  accessCode: string;
  shipmentId: string;
  type: CheckpointType;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [condition, setCondition] = useState<"GOOD" | "DAMAGED">("GOOD");
  const [conditionNotes, setConditionNotes] = useState("");
  const [approverName, setApproverName] = useState("");
  const [hasSignature, setHasSignature] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signatureRef = useRef<SignaturePadHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const approverLabel = type === "PICKUP" ? "Sender's name" : "Receiver's name";
  const actionLabel = type === "PICKUP" ? "Confirm pickup" : "Confirm delivery";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) {
      setError("Add at least one photo of the item(s).");
      return;
    }
    if (!approverName.trim()) {
      setError(`${approverLabel} is required.`);
      return;
    }
    const signatureBlob = await signatureRef.current?.getBlob();
    if (!signatureBlob) {
      setError("A signature is required.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("condition", condition);
      if (conditionNotes) formData.append("conditionNotes", conditionNotes);
      formData.append("approverName", approverName.trim());
      formData.append("signature", signatureBlob, "signature.png");
      Array.from(files).forEach((f) => formData.append("photos", f));

      const res = await fetch(
        `/api/driver/${encodeURIComponent(accessCode)}/shipments/${shipmentId}/checkpoint`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit.");
        return;
      }
      onDone();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
    >
      <div>
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Item condition
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCondition("GOOD")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
              condition === "GOOD"
                ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                : "border-slate-300 bg-white text-slate-600"
            }`}
          >
            Good
          </button>
          <button
            type="button"
            onClick={() => setCondition("DAMAGED")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
              condition === "DAMAGED"
                ? "border-red-600 bg-red-50 text-red-700"
                : "border-slate-300 bg-white text-slate-600"
            }`}
          >
            Damaged
          </button>
        </div>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Notes {condition === "DAMAGED" ? "(describe the damage)" : "(optional)"}
        </span>
        <textarea
          value={conditionNotes}
          onChange={(e) => setConditionNotes(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Photo(s) of the item(s)
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="block w-full text-sm"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          {approverLabel}
        </span>
        <input
          value={approverName}
          onChange={(e) => setApproverName(e.target.value)}
          placeholder="Full name"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </label>

      <div>
        <span className="mb-1 block text-sm font-medium text-slate-700">
          {type === "PICKUP" ? "Sender's" : "Receiver's"} signature
        </span>
        <SignaturePad ref={signatureRef} onChange={setHasSignature} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !hasSignature}
          className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Submitting…" : actionLabel}
        </button>
      </div>
    </form>
  );
}
