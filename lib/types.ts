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
  default_branch: string;
  owner: {
    login: string;
    type: string;
    avatar_url: string;
  };
  private: boolean;
  updated_at: string;
}

export interface Repository {
  id?: number;
  name: string;
  full_name: string;
  description: string;
  language: string;
  framework?: string | null;
  stars?: string;
  forks?: string;
  watchers?: string;
  updated_at: string;
  status: 'Running' | 'Paused' | 'Idle';
  private: boolean;
  pending_murders: number;
}