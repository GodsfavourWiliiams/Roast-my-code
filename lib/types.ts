export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  private: boolean;
  updated_at: string;
}

export interface Repository {
  id?: number; // Optional because it might not be in the UI view or comes from DB ID vs GitHub ID
  name: string;
  description: string;
  language: string;
  stars: string;
  forks: string;
  watchers: string;
  updatedAt: string;
  status: "Running" | "Paused";
  private: boolean;
  pendingMurders: number;
}
