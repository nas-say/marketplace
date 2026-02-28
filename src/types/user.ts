export interface User {
  id: string;
  displayName: string;
  avatar: string;
  bio: string;
  location: string;
  website: string;
  social: {
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
  stats: {
    totalSales: number;
    totalEarnings: number;
    listingsCount: number;
    betaTestsCompleted: number;
    feedbackGiven: number;
    memberSince: string;
  };
  verified: boolean;
}
