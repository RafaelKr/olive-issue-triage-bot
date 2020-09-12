import * as github from '@actions/github';

export async function issueRemoveLabel(
  client: github.GitHub,
  issueNumber: number,
  name: string
) {
  console.log(`Should remove label`, {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issueNumber,
    name
  })

  await client.issues.removeLabel({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issueNumber,
    name
  });
}
