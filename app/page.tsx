import { SpeechToTextDemo } from "./components/SpeechToTextDemo";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Speech to text
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Record audio and get a transcription using ElevenLabs Scribe v2.
          </p>
        </div>
        <SpeechToTextDemo />
      </main>
    </div>
  );
}
