/**
 * A single audio processing step. Receives the audio file and returns a result keyed by name.
 * All processors in the pipeline are run in parallel.
 */
export type AudioProcessor = (file: Blob) => Promise<{ result: string }>;
