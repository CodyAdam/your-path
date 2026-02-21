import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { analyseAudio } from "@/app/actions/analyse-audio";
import { Button } from "@/components/ui/button";

type Status = "idle" | "recording" | "transcribing";

export function PlaySpeechInput({
  disabled,
  onTranscribed,
}: {
  disabled?: boolean;
  onTranscribed: (transcript: string) => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const transcribeMutation = useMutation({
    mutationFn: (formData: FormData) => analyseAudio(formData),
    onSuccess: (data) => {
      const transcript = data.speechToText.result?.trim() ?? "";
      setStatus("idle");
      if (transcript) {
        console.log(
          `%c${transcript}`,
          "color: #2563eb; font-weight: bold; font-size: 2rem;"
        );
        onTranscribed(transcript);
      }
    },
    onError: (err: Error) => {
      setError(err.message ?? "Transcription failed");
      setStatus("idle");
    },
  });

  const startRecording = useCallback(async () => {
    setError("");
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
        setStatus("transcribing");
        const form = new FormData();
        form.append("audio", blob, "recording.webm");
        transcribeMutation.mutate(form);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setStatus("recording");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start microphone");
      setStatus("idle");
    }
  }, [transcribeMutation]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, [status]);

  const isBusy = status !== "idle" || transcribeMutation.isPending;
  const isDisabled = disabled || isBusy;

  return (
    <div className="flex flex-col items-center gap-2">
      {status === "idle" && !transcribeMutation.isPending && (
        <Button
          disabled={isDisabled}
          onClick={startRecording}
          size="lg"
          type="button"
        >
          Hold to record
        </Button>
      )}
      {status === "recording" && (
        <Button
          onClick={stopRecording}
          size="lg"
          type="button"
          variant="destructive"
        >
          Stop &amp; send
        </Button>
      )}
      {(status === "transcribing" || transcribeMutation.isPending) && (
        <p className="text-sm text-zinc-500">Transcribing…</p>
      )}
      {(error || transcribeMutation.isError) && (
        <p className="text-red-600 text-sm dark:text-red-400">
          {error ||
            (transcribeMutation.error instanceof Error
              ? transcribeMutation.error.message
              : "Transcription failed")}
        </p>
      )}
    </div>
  );
}
