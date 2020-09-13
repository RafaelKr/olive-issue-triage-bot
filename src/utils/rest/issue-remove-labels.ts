import * as github from '@actions/github';
import {githubClient} from '~/utils/github-client.util';

export async function issueRemoveLabel(
  issueNumber: number,
  name: string
) {
  await githubClient.issues.removeLabel({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issueNumber,
    name
  });
}
