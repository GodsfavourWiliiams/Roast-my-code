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
  id?: number; 
  name: string;
  full_name: string;
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
