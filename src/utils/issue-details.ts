import * as github from '@actions/github';

import {Issue} from '~/models';

export async function getIssueDetails(
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
