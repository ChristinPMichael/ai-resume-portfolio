"use client";

import { useState } from "react";

export function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function processResume() {
    if (!file) {
      setMessage("Please select a resume.");
      return;
    }

    setLoading(true);
    setMessage("Uploading and analyzing your resume...");

    try {
      // Step 1: Upload and extract text
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(
          uploadData.error || "Resume upload failed"
        );
      }

      // Step 2: Send resume to Gemini
      setMessage("Resume uploaded. AI is analyzing it...");

      const analyzeResponse = await fetch(
        "/api/resume/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resumeId: uploadData.resumeId,
          }),
        }
      );

      const analyzeData = await analyzeResponse.json();

      if (!analyzeResponse.ok) {
        throw new Error(
          analyzeData.error || "AI analysis failed"
        );
      }

      setMessage(
        "🎉 Your AI portfolio profile has been generated!"
      );

      console.log("AI Profile:", analyzeData.profile);
      console.log("Portfolio ID:", analyzeData.portfolioId);
      console.log("Username:", analyzeData.username);
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-xl font-semibold">
        Build your portfolio with AI
      </h2>

      <p className="mt-2 text-sm text-muted-foreground">
        Upload your PDF or DOCX resume and AI will
        automatically create your portfolio profile.
      </p>

      <input
        type="file"
        accept=".pdf,.docx"
        className="mt-6 block w-full text-sm"
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          setMessage("");
        }}
      />

      {file && (
        <div className="mt-3 rounded-md bg-muted p-3 text-sm">
          Selected: <strong>{file.name}</strong>
        </div>
      )}

      <button
        onClick={processResume}
        disabled={!file || loading}
        className="mt-5 rounded-md bg-black px-5 py-2.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Analyzing..."
          : "Generate My Portfolio"}
      </button>

      {message && (
        <p className="mt-4 text-sm">
          {message}
        </p>
      )}
    </div>
  );
}