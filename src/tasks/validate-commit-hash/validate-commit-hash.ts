import * as github from '@actions/github';
import {Issue, TriageBotConfig} from '~/models';
import {Octokit} from '@octokit/rest';
import {issueAddLabels} from '~/utils/issue-add-labels';
import {issueRemoveLabel} from '~/utils/issue-remove-labels';

export function validateCommitHash(
  client: github.GitHub,
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
    issueRemoveLabel(client, issue.id, label);
    return;
  }

  const commit = findCommit(client, config, commitHash);

  if (!commit) {
    log(`Commit was not found or didn't match config.`);
    issueRemoveLabel(client, issue.id, label);
    return;
  }

  issueAddLabels(client, issue.id, [config.validate_commit_hash.label]);
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
  client: github.GitHub,
  config: TriageBotConfig,
  commitHash: string
) {
  const userParams = config.validate_commit_hash.commits_api_params;
  let params: Octokit.RequestOptions & Octokit.ReposListCommitsParams = {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo
  };

  if (userParams.per_page) {
    params.per_page = userParams.per_page;
  }

  const response = await client.repos.listCommits(params);

  for (const commit of response.data) {
    if (commit.sha.indexOf(commitHash) === 0) {
      return commit;
    }
  }

  return null;
}

function log(...args) {
  console.log('[validateCommitHash]', ...args)
}
