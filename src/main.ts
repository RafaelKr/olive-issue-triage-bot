import * as core from '@actions/core';
import * as github from '@actions/github';

import {Issue, TriageBotConfig, Args} from '~/models';
import {getIssueDetails} from '~/utils/issue-details';
import {validateCommitHash} from '~/tasks';

async function run() {
  try {
    const args = getAndValidateArgs();

    let issue = github.context.payload.issue;
    if (!issue) {
      core.error(
        'No issue context found. This action can only run on issue creation.'
      );
      return;
    }

    core.info('Starting GitHub Client');
    const client = new github.GitHub(args.repoToken);

    core.info(`Loading config file at ${args.configPath}`);
    const config = await getConfig(client, args.configPath);

    await processIssue(client, config, issue.number);
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

async function processIssue(
  client: github.GitHub,
  config: TriageBotConfig,
  issueId: number
) {
  const issue: Issue = await getIssueDetails(client, issueId);

  if (config.validate_commit_hash) {
    try {
      await validateCommitHash(client, config, issue);
    } catch (e) {
      console.error(e);
    }
  }
}

async function getConfig(
  client: github.GitHub,
  configPath: string
): Promise<TriageBotConfig> {
  const response = await client.repos.getContents({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    path: configPath,
    ref: github.context.sha
  });

  // @ts-ignore
  return JSON.parse(Buffer.from(response.data.content, 'base64').toString());
}

function getAndValidateArgs(): Args {
  return {
    repoToken: core.getInput('repo-token', {required: true}),
    configPath: core.getInput('config-path', {required: false})
  };
}

run();
