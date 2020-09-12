import * as github from '@actions/github';

export async function issueRemoveLabel(
  client: github.GitHub,
  issueId: number,
  name: string
) {
  await client.issues.removeLabel({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issueId,
    name
  });
}
