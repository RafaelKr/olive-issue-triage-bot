import * as github from '@actions/github';

export async function issueAddLabels(
  client: github.GitHub,
  issueNumber: number,
  labels: Array<string>
) {
  await client.issues.addLabels({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issueNumber,
    labels
  });
}
