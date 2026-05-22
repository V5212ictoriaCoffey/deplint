import { Rule } from './rule';
import { noPlaintextSecrets } from './no-plaintext-secrets';
import { noUnpinnedActions } from './no-unpinned-actions';

export const allRules: Rule[] = [
  noPlaintextSecrets,
  noUnpinnedActions,
];

export function getRuleById(id: string): Rule | undefined {
  return allRules.find((rule) => rule.id === id);
}

export function getRulesForSeverity(severity: 'error' | 'warning'): Rule[] {
  // Rules don't declare a blanket severity — violations do.
  // This helper is a convenience for consumers that want to filter
  // the registered rule list by some other criterion in the future.
  void severity;
  return allRules;
}

export { noPlaintextSecrets, noUnpinnedActions };
export type { Rule } from './rule';
