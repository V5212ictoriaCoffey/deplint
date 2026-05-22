import { Rule, RuleContext, RuleViolation } from './rule';

const CURL_BASH_PATTERN = /curl[^|]*\|[^|]*bash/i;
const WGET_BASH_PATTERN = /wget[^|]*\|[^|]*bash/i;
const CURL_SH_PATTERN = /curl[^|]*\|[^|]*sh\b/i;
const WGET_SH_PATTERN = /wget[^|]*\|[^|]*sh\b/i;

export function checkStep(
  step: Record<string, unknown>,
  context: RuleContext
): RuleViolation[] {
  const violations: RuleViolation[] = [];

  const run = step['run'];
  if (typeof run !== 'string') return violations;

  const lines = run.split('\n');
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (
      CURL_BASH_PATTERN.test(trimmed) ||
      WGET_BASH_PATTERN.test(trimmed) ||
      CURL_SH_PATTERN.test(trimmed) ||
      WGET_SH_PATTERN.test(trimmed)
    ) {
      violations.push({
        ruleId: 'no-curl-bash',
        severity: 'error',
        message: `Detected piping remote script into shell on line ${index + 1}: "${trimmed.slice(0, 80)}". This is a supply chain attack vector.`,
        context,
      });
    }
  });

  return violations;
}

export const noCurlBash: Rule = {
  id: 'no-curl-bash',
  description: 'Disallows piping curl/wget output directly into bash or sh',
  severity: 'error',
  check(workflow, filePath) {
    const violations: RuleViolation[] = [];
    const jobs = (workflow['jobs'] as Record<string, unknown>) ?? {};

    for (const [jobId, job] of Object.entries(jobs)) {
      const steps = (job as Record<string, unknown>)['steps'] as unknown[];
      if (!Array.isArray(steps)) continue;

      steps.forEach((step, stepIndex) => {
        const ctx: RuleContext = { filePath, jobId, stepIndex };
        violations.push(
          ...checkStep(step as Record<string, unknown>, ctx)
        );
      });
    }

    return violations;
  },
};
