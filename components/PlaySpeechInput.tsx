import { useMutation } from "@tanstack/react-query";
import {
  LucideLoaderCircle,
  LucideMic,
  LucideMicOff,
  LucidePhoneOff,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { analyseAudio } from "@/app/actions/analyse-audio";
import { Button } from "@/components/ui/button";

type Status = "idle" | "recording" | "transcribing";

const DEBUG = true;

export function PlaySpeechInput({
  disabled,
  onTranscribed,
}: {
  disabled?: boolean;
  onTranscribed: (transcript: string) => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [lastRecordedBlob, setLastRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const transcribeMutation = useMutation({
    mutationFn: (formData: FormData) => {
      console.log("mutationFn called");
      return analyseAudio(formData);
    },
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
      toast.error(err.message ?? "Transcription failed");
      setStatus("idle");
    },
  });

  const startRecording = useCallback(async () => {
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
        setLastRecordedBlob(blob);
        setStatus("transcribing");
        const form = new FormData();
        form.append("audio", blob, "recording.webm");
        transcribeMutation.mutate(form);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setStatus("recording");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not start microphone"
      );
      setStatus("idle");
    }
  }, [transcribeMutation]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, [status]);

  const [lastRecordedUrl, setLastRecordedUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!lastRecordedBlob) {
      setLastRecordedUrl(null);
      return;
    }
    const url = URL.createObjectURL(lastRecordedBlob);
    setLastRecordedUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [lastRecordedBlob]);

  const isBusy = status !== "idle" || transcribeMutation.isPending;
  const isDisabled = disabled || isBusy;

  return (
    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3">
      {DEBUG && lastRecordedUrl && (
        // biome-ignore lint/a11y/useMediaCaption: debug playback only
        <audio controls preload="metadata" src={lastRecordedUrl}>
          Your browser does not support the audio element.
        </audio>
      )}
      {status === "idle" && !transcribeMutation.isPending && (
        <Button
          className="size-14 rounded-full"
          disabled={isDisabled}
          onClick={startRecording}
          size="lg"
          type="button"
        >
          <LucideMicOff className="size-6" />
        </Button>
      )}
      {status === "recording" && (
        <Button
          className="size-14 rounded-full"
          disabled={disabled}
          onClick={stopRecording}
          size="lg"
          type="button"
          variant={"secondary"}
        >
          <LucideMic className="size-6" />
        </Button>
      )}
      {(status === "transcribing" || transcribeMutation.isPending) && (
        <Button
          className="size-14 rounded-full"
          disabled
          size="lg"
          type="button"
        >
          <LucideLoaderCircle className="size-6 animate-spin" />
        </Button>
      )}
      <Link href="/">
        <Button
          className="h-14 gap-4 rounded-full px-4! text-lg"
          variant="destructive"
        >
          <LucidePhoneOff className="size-6" />
          Disconnect
        </Button>
      </Link>
    </div>
  );
}
