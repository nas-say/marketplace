import { Badge } from "@/components/ui/badge";
import { Feedback } from "@/types/feedback";
import { getUserById } from "@/lib/data";
import { Bug, Star, Lightbulb } from "lucide-react";

interface FeedbackItemProps {
  feedback: Feedback;
}

export function FeedbackItem({ feedback }: FeedbackItemProps) {
  const tester = getUserById(feedback.testerId);
  const typeIcon = feedback.type === "bug_report" ? <Bug className="h-4 w-4" /> : feedback.type === "ux_rating" ? <Star className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />;
  const typeLabel = feedback.type === "bug_report" ? "Bug Report" : feedback.type === "ux_rating" ? "UX Rating" : "Feature Suggestion";
  const typeColor = feedback.type === "bug_report" ? "text-red-400" : feedback.type === "ux_rating" ? "text-amber-400" : "text-blue-400";

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={typeColor}>{typeIcon}</span>
          <Badge variant="outline" className={`border-zinc-700 ${typeColor} text-xs`}>{typeLabel}</Badge>
        </div>
        <span className="text-xs text-zinc-500">
          {new Date(feedback.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>

      {feedback.bugReport && (
        <div>
          <h4 className="font-medium text-zinc-50">{feedback.bugReport.title}</h4>
          <Badge variant="secondary" className="mt-1 text-xs capitalize">{feedback.bugReport.severity}</Badge>
          <p className="mt-2 text-sm text-zinc-400 whitespace-pre-line">{feedback.bugReport.stepsToReproduce}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-zinc-500">Expected:</span> <span className="text-zinc-300">{feedback.bugReport.expected}</span></div>
            <div><span className="text-zinc-500">Actual:</span> <span className="text-zinc-300">{feedback.bugReport.actual}</span></div>
          </div>
        </div>
      )}

      {feedback.uxRating && (
        <div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: "Overall", val: feedback.uxRating.overall },
              { label: "Ease of Use", val: feedback.uxRating.easeOfUse },
              { label: "Design", val: feedback.uxRating.visualDesign },
              { label: "Performance", val: feedback.uxRating.performance },
            ].map((item) => (
              <div key={item.label} className="rounded bg-zinc-800 p-2">
                <p className="text-xs text-zinc-500">{item.label}</p>
                <p className="text-lg font-bold text-zinc-50">{item.val}/5</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-zinc-400">{feedback.uxRating.comments}</p>
        </div>
      )}

      {feedback.featureSuggestion && (
        <div>
          <h4 className="font-medium text-zinc-50">{feedback.featureSuggestion.title}</h4>
          <Badge variant="secondary" className="mt-1 text-xs capitalize">
            {feedback.featureSuggestion.priority.replace("_", " ")}
          </Badge>
          <p className="mt-2 text-sm text-zinc-400">{feedback.featureSuggestion.description}</p>
          <p className="mt-2 text-sm"><span className="text-zinc-500">Use case:</span> <span className="text-zinc-300">{feedback.featureSuggestion.useCase}</span></p>
        </div>
      )}

      {tester && (
        <p className="mt-3 text-xs text-zinc-500">— {tester.displayName}</p>
      )}
    </div>
  );
}
