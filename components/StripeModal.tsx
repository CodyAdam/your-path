"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface StripeModalProps {
  description?: React.ReactNode;
  onOpenChange: (open: boolean) => void;
  /** Called when user clicks Pay. Return checkout URL to redirect, or null to stay. */
  onPay: () => Promise<string | null>;
  open: boolean;
  payLabel?: string;
  title?: string;
}

const defaultTitle = "Video Story Generation";
const defaultDescription = (
  <>
    <p>
      Generating a custom interactive video story costs <strong>$5</strong> (10
      credits).
    </p>
    <p>
      Would you like to continue and generate your AI-powered story? If not you
      can try already created stories below.
    </p>
  </>
);

export function StripeModal({
  open,
  onOpenChange,
  onPay,
  title = defaultTitle,
  description = defaultDescription,
  payLabel = "Pay $5 via Stripe",
}: StripeModalProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">{description}</div>
        <div className="flex justify-end gap-3 pt-2">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={async () => {
              const url = await onPay();
              if (url) {
                window.location.href = url;
              }
            }}
          >
            {payLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
