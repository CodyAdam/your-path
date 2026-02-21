import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRun = vi.fn();

vi.mock("replicate", () => {
  return {
    default: class Replicate {
      run = mockRun;
      constructor() {}
    },
  };
});

describe("generateVideoFromImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.REPLICATE_API_TOKEN = "test-token";
  });

  it("calls replicate.run with correct parameters and default duration", async () => {
    const fakeUrl = "https://replicate.delivery/fake-video.mp4";
    mockRun.mockResolvedValue({ url: () => fakeUrl });

    const { generateVideoFromImage } = await import(
      "@/app/actions/_processing/video-generation"
    );

    const result = await generateVideoFromImage({
      imageUrl: "https://example.com/image.png",
      prompt: "A cat walking",
    });

    expect(mockRun).toHaveBeenCalledWith("bytedance/seedance-1.5-pro", {
      input: {
        fps: 24,
        image: "https://example.com/image.png",
        prompt: "A cat walking",
        duration: 5,
        resolution: "1080p",
        aspect_ratio: "16:9",
        camera_fixed: false,
        generate_audio: true,
      },
    });

    expect(result).toEqual({ videoUrl: fakeUrl });
  });

  it("uses custom duration when provided", async () => {
    const fakeUrl = "https://replicate.delivery/fake-video.mp4";
    mockRun.mockResolvedValue({ url: () => fakeUrl });

    const { generateVideoFromImage } = await import(
      "@/app/actions/_processing/video-generation"
    );

    await generateVideoFromImage({
      imageUrl: "https://example.com/image.png",
      prompt: "A dog running",
      duration: 10,
    });

    expect(mockRun).toHaveBeenCalledWith(
      "bytedance/seedance-1.5-pro",
      expect.objectContaining({
        input: expect.objectContaining({
          duration: 10,
        }),
      }),
    );
  });

  it("passes cameraFixed when provided", async () => {
    const fakeUrl = "https://replicate.delivery/fake-video.mp4";
    mockRun.mockResolvedValue({ url: () => fakeUrl });

    const { generateVideoFromImage } = await import(
      "@/app/actions/_processing/video-generation"
    );

    await generateVideoFromImage({
      imageUrl: "https://example.com/image.png",
      prompt: "Idle listening",
      cameraFixed: true,
    });

    expect(mockRun).toHaveBeenCalledWith(
      "bytedance/seedance-1.5-pro",
      expect.objectContaining({
        input: expect.objectContaining({
          camera_fixed: true,
        }),
      }),
    );
  });

  it("returns the video URL from the output", async () => {
    const fakeUrl = "https://replicate.delivery/another-video.mp4";
    mockRun.mockResolvedValue({ url: () => fakeUrl });

    const { generateVideoFromImage } = await import(
      "@/app/actions/_processing/video-generation"
    );

    const result = await generateVideoFromImage({
      imageUrl: "https://example.com/img.jpg",
      prompt: "Scenic view",
    });

    expect(result.videoUrl).toBe(fakeUrl);
  });
});
