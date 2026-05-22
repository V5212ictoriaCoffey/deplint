import { Rule, RuleContext, RuleViolation } from './rule';

const DANGEROUS_PERMISSIONS = ['write-all', 'write'];

function checkPermissions(
  permissions: unknown,
  path: string
): RuleViolation[] {
  const violations: RuleViolation[] = [];

  if (typeof permissions === 'string') {
    if (permissions === 'write-all') {
      violations.push({
        message: `Workflow uses 'write-all' permissions at ${path}, granting broad write access`,
        path,
        severity: 'error',
      });
    }
    return violations;
  }

  if (typeof permissions === 'object' && permissions !== null) {
    for (const [scope, value] of Object.entries(permissions)) {
      if (DANGEROUS_PERMISSIONS.includes(String(value))) {
        violations.push({
          message: `Permission '${scope}' is set to '${value}' at ${path}.${scope}, consider using read-only or removing if unused`,
          path: `${path}.${scope}`,
          severity: 'warning',
        });
      }
    }
  }

  return violations;
}

export const noWriteAllPermissions: Rule = {
  id: 'no-write-all-permissions',
  description: 'Disallows overly broad write permissions in workflows',
  severity: 'warning',
  check(context: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const { workflow } = context;

    if (workflow.permissions) {
      violations.push(
        ...checkPermissions(workflow.permissions, 'permissions')
      );
    }

    if (workflow.jobs) {
      for (const [jobId, job] of Object.entries(workflow.jobs)) {
        if ((job as any).permissions) {
          violations.push(
            ...checkPermissions(
              (job as any).permissions,
              `jobs.${jobId}.permissions`
            )
          );
        }
      }
    }

    return violations;
  },
};
