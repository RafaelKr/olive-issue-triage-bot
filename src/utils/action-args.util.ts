import {Args} from '~/models';
import * as core from '@actions/core';

export const args: Args = {
  repoToken: core.getInput('repo-token', {required: true}),
  configPath: core.getInput('config-path', {required: true})
};
