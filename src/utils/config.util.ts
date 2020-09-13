import * as github from '@actions/github';
import {TriageBotConfig} from '~/models';
import {args} from '~/utils/action-args.util';
import {githubClient} from '~/utils/github-client.util';

let config: TriageBotConfig;

export async function getConfig(): Promise<TriageBotConfig> {
  if (config) {
    return config;
  }

  const response = await githubClient.repos.getContents({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    path: args.configPath,
    ref: github.context.sha
  });

  // @ts-ignore
  config = JSON.parse(Buffer.from(response.data.content, 'base64').toString());

  return config;
}
