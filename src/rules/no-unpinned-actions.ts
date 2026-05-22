import { Rule, RuleContext, RuleViolation } from './rule';

const SHA_PATTERN = /^[a-f0-9]{40}$/;
const TAG_PATTERN = /^v\d+\.\d+\.\d+$/;

function checkStep(
  step: { uses?: string; name?: string },
  jobId: string,
  stepIndex: number
): RuleViolation | null {
  if (!step.uses) return null;

  const [actionRef, version] = step.uses.split('@');

  if (!version) {
    return {
      rule: 'no-unpinned-actions',
      severity: 'error',
      message: `Action "${actionRef}" has no version pin. Use a full SHA or tagged version.`,
      location: `jobs.${jobId}.steps[${stepIndex}]`,
    };
  }

  if (SHA_PATTERN.test(version)) {
    return null;
  }

  if (TAG_PATTERN.test(version)) {
    return {
      rule: 'no-unpinned-actions',
      severity: 'warning',
      message: `Action "${step.uses}" is pinned to a mutable tag. Consider pinning to a full commit SHA for reproducibility.`,
      location: `jobs.${jobId}.steps[${stepIndex}]`,
    };
  }

  if (version === 'main' || version === 'master' || version === 'latest') {
    return {
      rule: 'no-unpinned-actions',
      severity: 'error',
      message: `Action "${step.uses}" is pinned to a mutable branch or alias "${version}". This is a security risk.`,
      location: `jobs.${jobId}.steps[${stepIndex}]`,
    };
  }

  return null;
}

export const noUnpinnedActions: Rule = {
  id: 'no-unpinned-actions',
  description: 'Ensures GitHub Actions are pinned to a specific commit SHA or version tag.',
  check(context: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const { workflow } = context;

    if (!workflow.jobs) return violations;

    for (const [jobId, job] of Object.entries(workflow.jobs as Record<string, { steps?: { uses?: string; name?: string }[] }>)) {
      if (!job.steps) continue;

      job.steps.forEach((step, index) => {
        const violation = checkStep(step, jobId, index);
        if (violation) violations.push(violation);
      });
    }

    return violations;
  },
};
