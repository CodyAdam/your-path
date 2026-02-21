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

describe("generateImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.REPLICATE_API_TOKEN = "test-token";
  });

  it("calls replicate.run with correct parameters", async () => {
    const fakeUrl = "https://replicate.delivery/fake-image.jpg";
    mockRun.mockResolvedValue({ url: () => fakeUrl });

    const { generateImage } = await import(
      "@/app/actions/_processing/image-generation"
    );

    const result = await generateImage({
      prompt: "A young woman in a cozy cafe",
    });

    expect(mockRun).toHaveBeenCalledWith("google/nano-banana", {
      input: {
        prompt: "A young woman in a cozy cafe",
        image_input: [],
        aspect_ratio: "match_input_image",
        output_format: "jpg",
      },
    });

    expect(result).toEqual({ imageUrl: fakeUrl });
  });

  it("passes reference images when provided", async () => {
    const fakeUrl = "https://replicate.delivery/fake-image.jpg";
    mockRun.mockResolvedValue({ url: () => fakeUrl });

    const { generateImage } = await import(
      "@/app/actions/_processing/image-generation"
    );

    await generateImage({
      prompt: "Character in office",
      referenceImages: ["https://example.com/ref1.jpg", "https://example.com/ref2.jpg"],
    });

    expect(mockRun).toHaveBeenCalledWith(
      "google/nano-banana",
      expect.objectContaining({
        input: expect.objectContaining({
          image_input: ["https://example.com/ref1.jpg", "https://example.com/ref2.jpg"],
        }),
      }),
    );
  });

  it("uses custom aspect ratio and output format", async () => {
    const fakeUrl = "https://replicate.delivery/fake-image.png";
    mockRun.mockResolvedValue({ url: () => fakeUrl });

    const { generateImage } = await import(
      "@/app/actions/_processing/image-generation"
    );

    await generateImage({
      prompt: "Portrait",
      aspectRatio: "16:9",
      outputFormat: "png",
    });

    expect(mockRun).toHaveBeenCalledWith(
      "google/nano-banana",
      expect.objectContaining({
        input: expect.objectContaining({
          aspect_ratio: "16:9",
          output_format: "png",
        }),
      }),
    );
  });
});

describe("generateCharacter", () => {
  const mockGenerateImage = vi.fn();
  const mockWriteFile = vi.fn();
  const mockMkdir = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
  });

  it("downloads character image and saves to disk", async () => {
    vi.doMock("@/app/actions/_processing/image-generation", () => ({
      generateImage: mockGenerateImage,
    }));
    vi.doMock("node:fs/promises", () => ({
      writeFile: mockWriteFile,
      mkdir: mockMkdir,
    }));

    mockGenerateImage.mockResolvedValue({
      imageUrl: "https://replicate.delivery/character.jpg",
    });

    const mockArrayBuffer = new ArrayBuffer(8);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockArrayBuffer),
      }),
    );

    const { generateCharacter } = await import(
      "@/app/actions/generate-character"
    );

    const result = await generateCharacter({
      scenarioId: "dating",
      prompt: "A young woman in a cozy cafe",
    });

    expect(result).toEqual({
      scenarioId: "dating",
      imageUrl: "/images/characters/dating-character.jpg",
    });

    expect(mockMkdir).toHaveBeenCalledWith(
      expect.stringContaining("public/images/characters"),
      { recursive: true },
    );
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining("dating-character.jpg"),
      expect.any(Buffer),
    );
  });
});
