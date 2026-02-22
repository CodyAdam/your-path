"use client";

import type { Node } from "@xyflow/react";
import { Handle, type NodeProps, Position } from "@xyflow/react";
import { ImageOff } from "lucide-react";
import Image from "next/image";
import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { StoryImageNodeData } from "@/lib/graph-to-flow";

export type StoryImageNodeType = Node<StoryImageNodeData>;

function StoryImageNodeComponent(props: NodeProps<Node<StoryImageNodeData>>) {
  const { data } = props;
  const imageUrl = data?.imageUrl?.trim();

  return (
    <div className="w-[380px] rounded-lg border-2 border-zinc-200 bg-white px-3 py-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <Handle position={Position.Bottom} type="source" />
      <div className="flex flex-col gap-3">
        <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
          Story image
        </span>
        <div className="nodrag aspect-video w-full cursor-default overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
          {imageUrl ? (
            <Image
              alt="Story"
              className="h-full w-full object-cover"
              height={157}
              src={imageUrl}
              unoptimized
              width={280}
            />
          ) : (
            <div className="relative flex aspect-video h-full w-full flex-col items-center justify-center gap-2 px-2 text-center">
              <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
              <div className="relative z-10 flex flex-col items-center gap-2">
                <ImageOff className="size-6 text-zinc-500 dark:text-zinc-400" />
                <p className="font-medium text-[10px] text-zinc-500 dark:text-zinc-400">
                  No story image
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const StoryImageNode = memo(StoryImageNodeComponent);
