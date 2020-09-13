import * as github from '@actions/github';
import {githubClient} from '~/utils/github-client.util';

export async function issueAddLabels(
  issueNumber: number,
  labels: Array<string>
) {
  await githubClient.issues.addLabels({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issueNumber,
    labels
  });
}
