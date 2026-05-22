import { Rule } from './rule';
import { noPlaintextSecrets } from './no-plaintext-secrets';
import { noUnpinnedActions } from './no-unpinned-actions';
import { noWriteAllPermissions } from './no-write-all-permissions';
import { noPullRequestTarget } from './no-pull-request-target';
import { noCurlBash } from './no-curl-bash';
import { noDeprecatedActions } from './no-deprecated-actions';
import { noSelfHostedRunners } from './no-self-hosted-runners';
import { noSecretsInEnv } from './no-secrets-in-env';
import { noEnvContextInIf } from './no-env-context-in-if';
import { noScriptInjection } from './no-script-injection';
import { noCheckoutWithoutPersistCredentials } from './no-checkout-without-persist-credentials';
import { noMissingTimeout } from './no-missing-timeout';

const ALL_RULES: Rule[] = [
  noPlaintextSecrets,
  noUnpinnedActions,
  noWriteAllPermissions,
  noPullRequestTarget,
  noCurlBash,
  noDeprecatedActions,
  noSelfHostedRunners,
  noSecretsInEnv,
  noEnvContextInIf,
  noScriptInjection,
  noCheckoutWithoutPersistCredentials,
  noMissingTimeout,
];

export function getAllRules(): Rule[] {
  return ALL_RULES;
}

export function getRuleById(id: string): Rule | undefined {
  return ALL_RULES.find((rule) => rule.id === id);
}

export function getRulesForSeverity(severity: Rule['severity']): Rule[] {
  return ALL_RULES.filter((rule) => rule.severity === severity);
}
