import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { differenceInDays } from "date-fns";

export default function TrialBadge({ profile }) {
  if (!profile || profile.subscribed) return null;

  const trialEnd = profile.trialStart ? new Date(new Date(profile.trialStart).getTime() + 7 * 24 * 60 * 60 * 1000) : null;
  const daysLeft = trialEnd ? Math.max(0, differenceInDays(trialEnd, new Date())) : 7;

  return (
    <Badge variant="outline" className="gap-1 border-[#22A699] text-[#22A699] dark:border-[#22A699] dark:text-[#22A699] dark:bg-transparent">
      <Clock className="w-3 h-3" />
      {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
    </Badge>
  );
}