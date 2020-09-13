import * as github from '@actions/github';
import {args} from '~/utils/action-args.util';

export const githubClient = new github.GitHub(args.repoToken);
