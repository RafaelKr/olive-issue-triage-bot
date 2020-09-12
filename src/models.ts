import {Octokit} from '@octokit/rest';

export type Issue = Octokit.IssuesGetResponse;

export interface Args {
  repoToken: string;
  configPath: string;
}

export interface TriageBotConfig {
  validate_commit_hash: {
    hash_opening_tag: string;
    hash_closing_tag: string;
    label: string;
    commits_api_params: {
      per_page: number;
      since_in_days: number;
    };
  };
}
