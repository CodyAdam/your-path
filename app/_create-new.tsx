"use client";

import { useCallback } from "react";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  usePromptInputController,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";

const templates: { name: string; prompt: string }[] = [
  {
    name: "Board pitch",
    prompt:
      "A boardroom in a Fortune 500 HQ. A senior executive (CFO or COO) sits at the head of the table with 3–4 board members. They speak directly to the camera as if the viewer is the person pitching. Formal but not cold; they probe on numbers, risk, and timeline. Criteria: clear ROI, credible milestones, no hand-waving on execution.",
  },
  {
    name: "Trading desk",
    prompt:
      "A trading floor or glass-walled office overlooking the pit. A risk manager or senior trader sits across the desk, screens behind them. They address the viewer as the trader who just had a big move or drawdown. Tense but professional; they want a clear explanation, position sizing rationale, and what you’ll do next. No excuses, no blame—just facts and process.",
  },
  {
    name: "Break-up conversation",
    prompt:
      "Quiet living room or café, late afternoon. She sits on the couch or across the table, composed but clearly hurt. She speaks to the viewer as her partner. The conversation is about ending the relationship: she’s listening for honesty, respect, and no false hope. Tone: sad, real, no melodrama. She can tell if you’re dodging, lying to soften it, or being cruel.",
  },
];

export function CreateStory() {
  const controller = usePromptInputController();
  const handleSubmit = useCallback((message: PromptInputMessage) => {
    // You can handle the submitted prompt here
    // For now, just log it
    console.log("Submitted prompt:", message.text);
  }, []);

  return (
    <PromptInput className="max-w-2xl" onSubmit={handleSubmit}>
      <PromptInputBody>
        <PromptInputTextarea placeholder="Enter your story prompt..." />
      </PromptInputBody>
      <PromptInputFooter className="flex items-center gap-2">
        <span className="text-sm">Templates</span>
        {templates.map((template) => (
          <Button
            className="rounded-full"
            key={template.name}
            onClick={() => {
              controller.textInput.setInput(template.prompt);
            }}
            size={"sm"}
            type="button"
            variant={"outline"}
          >
            {template.name}
          </Button>
        ))}

        <PromptInputSubmit className="ml-auto" />
      </PromptInputFooter>
    </PromptInput>
  );
}
