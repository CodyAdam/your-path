"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const STORAGE_KEY = "prompt";

export interface StoryGenerationModalProps {
  creditCost: number;
  initialPrompt?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (prompt: string) => void | Promise<void>;
  open: boolean;
  submitting: boolean;
}

export function StoryGenerationModal({
  open,
  onOpenChange,
  initialPrompt = "",
  submitting,
  onSubmit,
  creditCost,
}: StoryGenerationModalProps) {
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    if (open) {
      const fromStorage =
        typeof window !== "undefined"
          ? (localStorage.getItem(STORAGE_KEY) ?? "")
          : "";
      setPrompt(initialPrompt.trim() || fromStorage);
    }
  }, [open, initialPrompt]);

  const handleSubmit = useCallback(async () => {
    await onSubmit(prompt);
    onOpenChange(false);
  }, [prompt, onSubmit, onOpenChange]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Story</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="story-prompt">Story prompt</Label>
            <Textarea
              className="min-h-24 resize-y"
              id="story-prompt"
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the story you want to generate..."
              rows={6}
              value={prompt}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Cancel
            </Button>
            <Button disabled={submitting} onClick={handleSubmit}>
              {submitting && <Loader2 className="size-5 animate-spin" />}
              Generate ({creditCost} credit{creditCost !== 1 ? "s" : ""})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
