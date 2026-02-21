"use client";

import { useEffect, useRef, useState } from "react";

export function PlayCameraPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let stream: MediaStream | null = null;
    setError("");

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((s) => {
        stream = s;
        const video = videoRef.current;
        if (video) {
          video.srcObject = s;
        }
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Could not access camera");
      });

    return () => {
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
      }
    };
  }, []);

  if (error) {
    return (
      <div className="absolute bottom-4 left-4 flex h-24 w-32 items-center justify-center rounded-lg border border-zinc-300 bg-zinc-100 p-2 text-center text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
        Camera unavailable
      </div>
    );
  }

  return (
    <div className="absolute bottom-4 left-4 aspect-video w-1/3 overflow-hidden rounded-lg border border-zinc-300 bg-zinc-900 shadow-lg dark:border-zinc-700">
      <video
        autoPlay
        className="h-full w-full object-cover"
        muted
        playsInline
        ref={videoRef}
        style={{ transform: "scaleX(-1)" }}
      />
    </div>
  );
}
