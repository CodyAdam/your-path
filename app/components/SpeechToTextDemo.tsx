"use client";

import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { analyseAudio } from "@/app/actions/analyse-audio";

type Status = "idle" | "recording" | "sending" | "done" | "error";

export function SpeechToTextDemo() {
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => analyseAudio(formData),
    onSuccess: (data) => {
      setTranscript(data.speechToText.result ?? "");
      setStatus("done");
    },
    onError: (err: Error) => {
      setError(err.message ?? "Upload failed");
      setStatus("error");
    },
  });

  useEffect(() => {
    return () => {
      if (playbackUrl) {
        URL.revokeObjectURL(playbackUrl);
      }
    };
  }, [playbackUrl]);

  const startRecording = useCallback(async () => {
    setError("");
    setTranscript("");
    uploadMutation.reset();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        setPlaybackUrl((prev) => {
          if (prev) {
            URL.revokeObjectURL(prev);
          }
          return URL.createObjectURL(blob);
        });
        setStatus("sending");

        const form = new FormData();
        form.append("audio", blob, "recording.webm");
        uploadMutation.mutate(form);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setStatus("recording");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start microphone");
      setStatus("error");
    }
  }, [uploadMutation]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, [status]);

  const reset = useCallback(() => {
    setPlaybackUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
    setStatus("idle");
    setTranscript("");
    setError("");
    uploadMutation.reset();
  }, [uploadMutation]);

  const mutationError =
    uploadMutation.isError && uploadMutation.error
      ? uploadMutation.error instanceof Error
        ? uploadMutation.error.message
        : String(uploadMutation.error)
      : null;
  const displayError = error || mutationError;

  return (
    <div className="flex w-full max-w-lg flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
        Speech to text (ElevenLabs Scribe v2)
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Record, then we'll send the full audio to the server and show the
        transcription.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {status === "idle" && (
          <button
            className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-sm text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            onClick={startRecording}
            type="button"
          >
            Start recording
          </button>
        )}
        {status === "recording" && (
          <button
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-sm text-white hover:bg-red-700"
            onClick={stopRecording}
            type="button"
          >
            Stop & transcribe
          </button>
        )}
        {(status === "done" || status === "error") && (
          <button
            className="rounded-lg border border-zinc-300 px-4 py-2 font-medium text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            onClick={reset}
            type="button"
          >
            Record again
          </button>
        )}
      </div>

      {status === "recording" && (
        <p className="text-amber-600 text-sm dark:text-amber-400">
          Recording… click "Stop & transcribe" when done.
        </p>
      )}
      {(status === "sending" || uploadMutation.isPending) && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Transcribing…
        </p>
      )}
      {playbackUrl && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="mb-2 font-medium text-xs text-zinc-500 uppercase tracking-wide dark:text-zinc-400">
            Playback
          </p>
          <audio
            className="w-full"
            controls
            preload="metadata"
            src={playbackUrl}
          />
        </div>
      )}
      {displayError && (
        <p className="text-red-600 text-sm dark:text-red-400">{displayError}</p>
      )}
      {transcript && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="font-medium text-xs text-zinc-500 uppercase tracking-wide dark:text-zinc-400">
            Transcript
          </p>
          <p className="mt-1 whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">
            {transcript}
          </p>
        </div>
      )}
    </div>
  );
}
