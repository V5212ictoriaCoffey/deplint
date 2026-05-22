import { Rule, RuleContext, RuleViolation } from './rule';

const SECRET_PATTERNS: RegExp[] = [
  /password/i,
  /passwd/i,
  /secret/i,
  /api[_-]?key/i,
  /auth[_-]?token/i,
  /access[_-]?token/i,
  /private[_-]?key/i,
  /credentials/i,
];

const EXPRESSION_PATTERN = /^\${{\s*secrets\./;

function isSuspiciousKey(key: string): boolean {
  return SECRET_PATTERNS.some((pattern) => pattern.test(key));
}

function isHardcodedValue(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (value.trim() === '') return false;
  if (EXPRESSION_PATTERN.test(value.trim())) return false;
  if (/^\${{/.test(value.trim())) return false;
  return true;
}

function checkEnvBlock(
  env: Record<string, unknown>,
  context: RuleContext,
  location: string
): RuleViolation[] {
  const violations: RuleViolation[] = [];
  for (const [key, value] of Object.entries(env)) {
    if (isSuspiciousKey(key) && isHardcodedValue(value)) {
      violations.push({
        ruleId: 'no-secrets-in-env',
        severity: 'error',
        message: `Hardcoded secret detected in env variable "${key}" at ${location}. Use \${{ secrets.* }} instead.`,
        file: context.filePath,
      });
    }
  }
  return violations;
}

export const noSecretsInEnv: Rule = {
  id: 'no-secrets-in-env',
  name: 'No Secrets in Env',
  description: 'Detects hardcoded secrets in env blocks at workflow, job, or step level.',
  severity: 'error',
  check(context: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const { workflow } = context;

    if (workflow.env && typeof workflow.env === 'object') {
      violations.push(...checkEnvBlock(workflow.env as Record<string, unknown>, context, 'workflow level'));
    }

    for (const [jobId, job] of Object.entries(workflow.jobs ?? {})) {
      if (job.env && typeof job.env === 'object') {
        violations.push(...checkEnvBlock(job.env as Record<string, unknown>, context, `job "${jobId}"`) );
      }
      for (const [stepIndex, step] of (job.steps ?? []).entries()) {
        if (step.env && typeof step.env === 'object') {
          violations.push(...checkEnvBlock(step.env as Record<string, unknown>, context, `job "${jobId}" step ${stepIndex + 1}`));
        }
      }
    }

    return violations;
  },
};
