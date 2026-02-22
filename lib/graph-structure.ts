import { z } from "zod";

export const nodeSchema = z.object({
  id: z.string(),
  title: z.string().describe("The title of the node."),
  script: z
    .string()
    .describe(
      "The content of what the scenario will show / say in this video segment. This can be a descriptive script or a dialogue."
    ),
  videoUrl: z
    .string()
    .describe(
      "The URL or path of the video for this node (e.g. /videos/filename.mp4 or full URL)."
    )
    .optional(),
  toast: z
    .object({
      message: z
        .string()
        .describe(
          "The message to display to the user when this node is visited."
        ),
      type: z
        .enum(["positive", "negative", "neutral"])
        .describe("The type of toast to display."),
    })
    .optional(),
  options: z
    .array(
      z.object({
        condition: z
          .string()
          .describe(
            "The condition that must be met to select this scenario path."
          ),
        nodeId: z
          .string()
          .describe(
            "The node ID of the next node to visit if the condition is met."
          ),
      })
    )
    .describe(
      "The options available from this node. If no options are provided, the node is considered to be an end node"
    ),
  fallbackNodeId: z
    .string()
    .describe("The node ID of the next node to visit if no condition is met.")
    .optional(),
});

export const graphStructure = z
  .object({
    id: z.string(),
    title: z.string(),
    idleVideoUrl: z
      .string()
      .describe(
        "The URL or path of the video to play when idle (e.g. /videos/idle.mp4 or full URL)."
      )
      .optional(),
    startImageUrl: z
      .string()
      .optional()
      .describe(
        "The image that will be used to generate the video. This should be a URL to an image."
      ),
    prompt: z
      .string()
      .describe(
        "The prompt that will be used to generate the video. This should be a concise description of the scenario."
      ),
    startNodeId: z
      .string()
      .describe(
        "The node ID of the first node to visit. Start of the scenario."
      ),
    nodes: z.array(nodeSchema),
  })
  .describe(
    "The structure of the scenario graph. The graph can be cyclic, where the nodes are the vertices and the edges are the connections between the nodes."
  );

export type GraphStructure = z.infer<typeof graphStructure>;
export type GraphNode = z.infer<typeof nodeSchema>;
