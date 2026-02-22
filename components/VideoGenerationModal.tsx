"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface VideoGenerationModalProps {
  creditCost: number;
  nodeCount: number;
  onGenerate: () => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  submitting: boolean;
}

export function VideoGenerationModal({
  open,
  onOpenChange,
  nodeCount,
  onGenerate,
  creditCost,
  submitting,
}: VideoGenerationModalProps) {
  const handleGenerate = async () => {
    await onGenerate();
    onOpenChange(false);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Videos</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Would you like to generate videos for the {nodeCount} node
            {nodeCount !== 1 ? "s" : ""} of this graph?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Cancel
            </Button>
            <Button disabled={submitting} onClick={handleGenerate}>
              {submitting && <Loader2 className="size-5 animate-spin" />}
              Generate ({creditCost} credit{creditCost !== 1 ? "s" : ""})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
