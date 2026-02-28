"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { applyAction } from "./actions";
import { CheckCircle, Loader2 } from "lucide-react";

interface Props {
  betaTestId: string;
  alreadyApplied: boolean;
  closed: boolean;
}

export function ApplyButton({ betaTestId, alreadyApplied, closed }: Props) {
  const [applied, setApplied] = useState(alreadyApplied);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (closed) {
    return <Button disabled className="w-full">Testing Closed</Button>;
  }

  if (applied) {
    return (
      <Button disabled className="w-full bg-green-700 hover:bg-green-700 text-white">
        <CheckCircle className="mr-2 h-4 w-4" />Applied
      </Button>
    );
  }

  const handleClick = async () => {
    setLoading(true);
    setError("");
    const result = await applyAction(betaTestId);
    if (result.error) {
      setError(result.error);
    } else {
      setApplied(true);
    }
    setLoading(false);
  };

  return (
    <div>
      <Button
        className="w-full bg-indigo-600 hover:bg-indigo-500"
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Applying...</>
        ) : (
          "Sign Up to Test"
        )}
      </Button>
      {error && <p className="mt-2 text-xs text-red-400 text-center">{error}</p>}
    </div>
  );
}
