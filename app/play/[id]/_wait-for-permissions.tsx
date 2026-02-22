"use client";

import { LucidePhoneIncoming } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type PermissionState = "prompt" | "checking" | "granted" | "denied";

export function WaitForPermissions({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<PermissionState>("checking");
  const [error, setError] = useState<string>("");
  const [ready, setReady] = useState(false);

  const requestPermissions = useCallback(async () => {
    setError("");
    setState("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      for (const track of stream.getTracks()) {
        track.stop();
      }
      setState("granted");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Microphone and camera access denied";
      setError(message);
      setState("denied");
    }
  }, []);

  useEffect(() => {
    if (state !== "checking") {
      return;
    }
    requestPermissions();
  }, [state, requestPermissions]);

  if (state === "granted" && ready) {
    return <>{children}</>;
  }

  if (state === "granted" && !ready) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-zinc-50 p-8 dark:bg-zinc-950">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <h1 className="font-semibold text-xl text-zinc-900 dark:text-zinc-100">
            You are all set!
          </h1>

          <Button
            className="mt-4 h-14 gap-4 rounded-full px-4! text-lg"
            onClick={() => setReady(true)}
            variant="success"
          >
            <LucidePhoneIncoming className="size-6" />
            Connect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-zinc-50 p-8 dark:bg-zinc-950">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <h1 className="font-semibold text-xl text-zinc-900 dark:text-zinc-100">
          Microphone &amp; camera required
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          This experience uses your microphone for voice choices and your camera
          for a small preview. Please allow access to continue.
        </p>
        {state === "denied" && (
          <p className="text-red-600 text-sm dark:text-red-400">{error}</p>
        )}
        {(state === "denied" || state === "prompt") && (
          <Button onClick={requestPermissions} type="button">
            Allow microphone &amp; camera
          </Button>
        )}
        {state === "checking" && (
          <p className="text-sm text-zinc-500">Checking permissions…</p>
        )}
      </div>
    </div>
  );
}
