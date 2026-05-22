import { Rule, RuleContext, RuleViolation } from './rule';

const SECRET_PATTERNS = [
  /password\s*[:=]\s*["']?[^$({\s"']+/i,
  /api[_-]?key\s*[:=]\s*["']?[^$({\s"']+/i,
  /token\s*[:=]\s*["']?[^$({\s"']+/i,
  /secret\s*[:=]\s*["']?[^$({\s"']+/i,
];

function scanValue(value: unknown, path: string, file: string, violations: RuleViolation[]): void {
  if (typeof value === 'string') {
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(value)) {
        violations.push({
          ruleId: 'no-plaintext-secrets',
          severity: 'error',
          message: `Possible plaintext secret detected at "${path}". Use ${{ secrets.YOUR_SECRET }} instead.`,
          file,
          path,
        });
        break;
      }
    }
  } else if (typeof value === 'object' && value !== null) {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      scanValue(child, `${path}.${key}`, file, violations);
    }
  }
}

export const noPlaintextSecrets: Rule = {
  id: 'no-plaintext-secrets',
  description: 'Detects possible plaintext secrets in workflow files.',
  severity: 'error',
  check(context: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    scanValue(context.workflow, 'workflow', context.file, violations);
    return violations;
  },
};
