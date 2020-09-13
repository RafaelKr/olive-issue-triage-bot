import * as github from '@actions/github';
import {Octokit} from '@octokit/rest';

import {subDays, startOfDay} from 'date-fns';

import {Issue, TriageBotConfig} from '~/models';
import {issueAddLabels} from '~/utils/rest/issue-add-labels';
import {issueRemoveLabel} from '~/utils/rest/issue-remove-labels';
import {githubClient} from '~/utils/github-client.util';

export async function validateCommitHash(
  config: TriageBotConfig,
  issue: Issue
) {
  const label = config.validate_commit_hash.label;

  if (!label) {
    log(`Config file doesn't contain a label at validate_commit_hash.label`);
    return;
  }

  const commitHash = extractCommitHash(config, issue);

  if (!commitHash) {
    await issueRemoveLabel(issue.number, label);
    return;
  }

  const commit = await findCommit(config, commitHash, new Date(issue.created_at));

  if (!commit) {
    log(`Commit was not found or didn't match config.`);
    await issueRemoveLabel(issue.number, label);
    return;
  }

  await issueAddLabels(issue.number, [config.validate_commit_hash.label]);
}

function extractCommitHash(
  config: TriageBotConfig,
  issue: Issue
) {
  const hashOpeningTag = config.validate_commit_hash.hash_opening_tag;
  const hashClosingTag = config.validate_commit_hash.hash_closing_tag;
  const hashRegex = /^\s*?(\w{7,})\s*$/m;

  const hashStartPosition =
    issue.body.indexOf(hashOpeningTag) + hashOpeningTag.length;

  if (hashStartPosition === -1) {
    log(`Hash opening tag (${hashOpeningTag}) could not be found`);
    return;
  }

  const hashEndPosition = issue.body.indexOf(hashClosingTag, hashStartPosition);

  if (hashStartPosition === -1) {
    log(`Hash closing tag (${hashClosingTag}) could not be found`);
    return;
  }

  const hashTagContent = issue.body.slice(hashStartPosition, hashEndPosition);
  const hashMatch = hashTagContent.match(hashRegex);

  if (!hashMatch || !hashMatch[1]) {
    log(`Couldn't extract valid commit hash from issue body.`);
    return;
  }

  return hashMatch[1];
}

async function findCommit(
  config: TriageBotConfig,
  commitHash: string,
  issueDate: Date = new Date()
) {
  const userParams = config.validate_commit_hash.commits_api_params;
  let params: Octokit.RequestOptions & Octokit.ReposListCommitsParams = {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo
  };

  if (typeof userParams.per_page === 'number') {
    params.per_page = userParams.per_page;
  }

  if (typeof userParams.since_in_days === 'number') {
    // subtract days from now. use start of date.
    const date = startOfDay(subDays(issueDate, userParams.since_in_days));
    params.since = date.toISOString();
  }

  const response = await githubClient.repos.listCommits(params);

  for (const commit of response.data) {
    if (commit.sha.indexOf(commitHash) === 0) {
      return commit;
    }
  }

  return null;
}

function log(...args) {
  console.log('[validateCommitHash]', ...args);
}
