export interface BugReport {
  title: string;
  severity: "critical" | "major" | "minor" | "cosmetic";
  stepsToReproduce: string;
  expected: string;
  actual: string;
}

export interface UxRating {
  overall: number;
  easeOfUse: number;
  visualDesign: number;
  performance: number;
  comments: string;
}

export interface FeatureSuggestion {
  title: string;
  description: string;
  priority: "must_have" | "nice_to_have" | "future";
  useCase: string;
}

export interface Feedback {
  id: string;
  betaTestId: string;
  testerId: string;
  type: "bug_report" | "ux_rating" | "feature_suggestion";
  createdAt: string;
  bugReport?: BugReport;
  uxRating?: UxRating;
  featureSuggestion?: FeatureSuggestion;
}
