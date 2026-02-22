import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGenerateVideoFromImage = vi.fn();
const mockWriteFile = vi.fn();
const mockMkdir = vi.fn();

vi.mock("@/app/actions/_processing/video-generation", () => ({
  generateVideoFromImage: mockGenerateVideoFromImage,
}));

vi.mock("node:fs/promises", () => ({
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
}));

describe("generateVideo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
  });

  async function loadModule() {
    const mod = await import("@/app/actions/generate-video");
    return mod;
  }

  function stubFetch(ok = true) {
    const mockArrayBuffer = new ArrayBuffer(8);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok,
        status: ok ? 200 : 500,
        statusText: ok ? "OK" : "Internal Server Error",
        arrayBuffer: () => Promise.resolve(mockArrayBuffer),
      })
    );
  }

  it("generates main + idle videos for non-terminal nodes", async () => {
    mockGenerateVideoFromImage.mockResolvedValue({
      videoUrl: "https://replicate.delivery/video.mp4",
    });
    stubFetch();

    const { generateVideo } = await loadModule();

    const result = await generateVideo({
      nodeId: "node-1",
      script: "A hero enters the scene",
      imageUrl: "https://example.com/hero.png",
      graphPrompt: "Epic adventure",
    });

    // Should be called twice: main + idle
    expect(mockGenerateVideoFromImage).toHaveBeenCalledTimes(2);

    // Main video call
    expect(mockGenerateVideoFromImage).toHaveBeenCalledWith({
      imageUrl: "https://example.com/hero.png",
      prompt: "Epic adventure. Scene: A hero enters the scene",
      duration: 5,
    });

    // Idle video call
    expect(mockGenerateVideoFromImage).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: "https://example.com/hero.png",
        duration: 3,
        cameraFixed: true,
      })
    );

    expect(result.mainVideoUrl).toBe("/videos/node-node-1-main.mp4");
    expect(result.idleVideoUrl).toBe("/videos/node-node-1-idle.mp4");
  });

  it("skips idle video for terminal nodes", async () => {
    mockGenerateVideoFromImage.mockResolvedValue({
      videoUrl: "https://replicate.delivery/video.mp4",
    });
    stubFetch();

    const { generateVideo } = await loadModule();

    const result = await generateVideo({
      nodeId: "win",
      script: "You won!",
      imageUrl: "https://example.com/img.png",
      graphPrompt: "Test",
      skipIdle: true,
    });

    // Only main video generated
    expect(mockGenerateVideoFromImage).toHaveBeenCalledTimes(1);
    expect(result.mainVideoUrl).toBe("/videos/node-win-main.mp4");
    expect(result.idleVideoUrl).toBeUndefined();
  });

  it("downloads and saves videos to disk", async () => {
    mockGenerateVideoFromImage.mockResolvedValue({
      videoUrl: "https://replicate.delivery/video.mp4",
    });
    stubFetch();

    const { generateVideo } = await loadModule();

    await generateVideo({
      nodeId: "abc",
      script: "Scene",
      imageUrl: "https://example.com/img.png",
      graphPrompt: "Prompt",
    });

    // fetch called for both main + idle downloads
    expect(global.fetch).toHaveBeenCalledWith(
      "https://replicate.delivery/video.mp4"
    );
    expect(mockMkdir).toHaveBeenCalledWith(
      expect.stringContaining("public/videos"),
      { recursive: true }
    );
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining("node-abc-main.mp4"),
      expect.any(Buffer)
    );
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining("node-abc-idle.mp4"),
      expect.any(Buffer)
    );
  });

  it("throws an error when fetch fails", async () => {
    mockGenerateVideoFromImage.mockResolvedValue({
      videoUrl: "https://replicate.delivery/video.mp4",
    });
    stubFetch(false);

    const { generateVideo } = await loadModule();

    await expect(
      generateVideo({
        nodeId: "node-1",
        script: "Scene",
        imageUrl: "https://example.com/img.png",
        graphPrompt: "Prompt",
        skipIdle: true,
      })
    ).rejects.toThrow(
      "Failed to download video from Replicate: 500 Internal Server Error"
    );
  });
});
