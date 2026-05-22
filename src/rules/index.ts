import { Rule } from './rule';
import { noPlaintextSecrets } from './no-plaintext-secrets';
import { noUnpinnedActions } from './no-unpinned-actions';
import { noWriteAllPermissions } from './no-write-all-permissions';
import { noPullRequestTarget } from './no-pull-request-target';
import { noCurlBash } from './no-curl-bash';

const ALL_RULES: Rule[] = [
  noPlaintextSecrets,
  noUnpinnedActions,
  noWriteAllPermissions,
  noPullRequestTarget,
  noCurlBash,
];

export function getAllRules(): Rule[] {
  return ALL_RULES;
}

export function getRuleById(id: string): Rule | undefined {
  return ALL_RULES.find((rule) => rule.id === id);
}

export function getRulesForSeverity(
  severity: 'error' | 'warning' | 'info'
): Rule[] {
  return ALL_RULES.filter((rule) => rule.severity === severity);
}
