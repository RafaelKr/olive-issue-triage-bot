import * as core from '@actions/core';
import * as github from '@actions/github';

import {Issue, TriageBotConfig} from '~/models';
import {validateCommitHash} from '~/tasks';

import {args} from '~/utils/action-args.util';
import {getConfig} from '~/utils/config.util';
import {getIssueDetails} from '~/utils/rest/issue-details';

async function run() {
  try {
    core.info(`Loading config file at ${args.configPath}`);
    const config = await getConfig();

    await processIssue(config);
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

async function processIssue(
  config: TriageBotConfig,
) {
  const {issue} = github.context.payload;
  if (!issue) {
    core.error(
      'No issue context found. This action can only run on issue creation.'
    );
    return;
  }

  const issueDetails: Issue = await getIssueDetails(issue.number);

  if (config.validate_commit_hash) {
    try {
      await validateCommitHash(config, issueDetails);
    } catch (e) {
      console.error(e);
    }
  }
}

run();
