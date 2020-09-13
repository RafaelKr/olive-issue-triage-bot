import * as github from '@actions/github';

import {Issue} from '~/models';
import {githubClient} from '~/utils/github-client.util';

export async function getIssueDetails(
  issueNumber: number
): Promise<Issue> {
  return (
    await githubClient.issues.get({
      issue_number: issueNumber,
      owner: github.context.repo.owner,
      repo: github.context.repo.repo
    })
  ).data;
}
