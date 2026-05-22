import { Rule, Severity } from './rule';
import { noPlaintextSecrets } from './no-plaintext-secrets';
import { noUnpinnedActions } from './no-unpinned-actions';
import { noWriteAllPermissions } from './no-write-all-permissions';

const ALL_RULES: Rule[] = [
  noPlaintextSecrets,
  noUnpinnedActions,
  noWriteAllPermissions,
];

export function getRuleById(id: string): Rule | undefined {
  return ALL_RULES.find((rule) => rule.id === id);
}

export function getRulesForSeverity(severity: Severity): Rule[] {
  const order: Severity[] = ['error', 'warning', 'info'];
  const threshold = order.indexOf(severity);
  return ALL_RULES.filter(
    (rule) => order.indexOf(rule.severity) <= threshold
  );
}

export function getAllRules(): Rule[] {
  return [...ALL_RULES];
}

export { Rule, RuleViolation, RuleContext, Severity } from './rule';
