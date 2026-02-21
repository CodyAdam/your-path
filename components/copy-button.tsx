"use client";

import { Copy } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface CopyButtonProps extends React.ComponentProps<typeof Button> {
  label?: string;
  successMessage?: string;
  value: string;
}

export function CopyButton({
  value,
  label = "Copy",
  successMessage = "Copied to clipboard!",
  ...props
}: CopyButtonProps) {
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    toast.success(successMessage);
  }, [value, successMessage]);

  return (
    <Button aria-label={label} onClick={handleCopy} type="button" {...props}>
      <Copy className="h-5 w-5" />
      {label}
    </Button>
  );
}
