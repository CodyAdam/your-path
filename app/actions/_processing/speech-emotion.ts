import { AudioProcessor } from "./types";

export const speechToEmotion: AudioProcessor = async (
    file: Blob
  ) => {
    return { result: "happy" };
};