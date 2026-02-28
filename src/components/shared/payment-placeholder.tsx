"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

interface PaymentPlaceholderProps {
  open: boolean;
  onClose: () => void;
}

export function PaymentPlaceholder({ open, onClose }: PaymentPlaceholderProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10">
            <ShieldCheck className="h-6 w-6 text-indigo-500" />
          </div>
          <DialogTitle className="text-center text-zinc-50">Secure Payment Coming Soon</DialogTitle>
          <DialogDescription className="text-center text-zinc-400">
            We&apos;re building escrow-based secure payments powered by Stripe. For now, you can contact the seller directly to arrange the purchase.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col gap-2">
          <Button className="bg-indigo-600 hover:bg-indigo-500">Contact Seller</Button>
          <Button variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-300">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
