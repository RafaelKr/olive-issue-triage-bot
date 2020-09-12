import * as core from '@actions/core';
import * as github from '@actions/github';
import {Octokit} from '@octokit/rest';

type Issue = Octokit.IssuesGetResponse;

type Args = {
  repoToken: string;
  configPath: string;
};

type TriageBotConfig = {
  labels: Array<{
    label: string;
    globs: Array<string>;
    comment?: string;
  }>;
  comment?: string;
  no_label_comment?: string;
};

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

    console.log(config);

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
  const issue: Issue = await getIssue(client, issueId);
  const commitHash = extractCommitHash(issue);

  console.log({commitHash});
}

function extractCommitHash(issue: Issue) {
  const hashOpeningTag = '<!-- HASH -->';
  const hashClosingTag = '<!-- /HASH -->';
  const hashRegex = /^\s*?(\w+)\s*$/m;

  const hashStartPosition =
    issue.body.indexOf(hashOpeningTag) + hashOpeningTag.length;

  if (hashStartPosition === -1) {
    console.log(`Hash opening tag (${hashOpeningTag}) could not be found`);
    return;
  }

  const hashEndPosition = issue.body.indexOf(hashClosingTag, hashStartPosition);

  if (hashStartPosition === -1) {
    console.log(`Hash closing tag (${hashClosingTag}) could not be found`);
    return;
  }

  const hashTagContent = issue.body.slice(hashStartPosition, hashEndPosition);
  const hashMatch = hashTagContent.match(hashRegex);

  if (!hashMatch || !hashMatch[1]) {
    return;
  }

  return hashMatch[1];
}

async function writeComment(
  client: github.GitHub,
  issueId: number,
  body: string
) {
  await client.issues.createComment({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issueId,
    body: body
  });
}

async function addLabels(
  client: github.GitHub,
  issueId: number,
  labels: Array<string>
) {
  await client.issues.addLabels({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issueId,
    labels
  });
}

async function getIssue(
  client: github.GitHub,
  issueId: number
): Promise<Issue> {
  return (
    await client.issues.get({
      issue_number: issueId,
      owner: github.context.repo.owner,
      repo: github.context.repo.repo
    })
  ).data;
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
