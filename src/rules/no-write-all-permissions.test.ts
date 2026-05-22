import { noWriteAllPermissions } from './no-write-all-permissions';
import { RuleContext } from './rule';

function makeContext(workflow: object): RuleContext {
  return {
    workflow: workflow as any,
    filePath: 'test.yml',
  };
}

describe('no-write-all-permissions', () => {
  it('reports error for top-level write-all', () => {
    const ctx = makeContext({ permissions: 'write-all', jobs: {} });
    const violations = noWriteAllPermissions.check(ctx);
    expect(violations).toHaveLength(1);
    expect(violations[0].severity).toBe('error');
    expect(violations[0].message).toContain('write-all');
  });

  it('reports warning for write permission on a specific scope', () => {
    const ctx = makeContext({
      permissions: { contents: 'write', issues: 'read' },
      jobs: {},
    });
    const violations = noWriteAllPermissions.check(ctx);
    expect(violations).toHaveLength(1);
    expect(violations[0].severity).toBe('warning');
    expect(violations[0].path).toBe('permissions.contents');
  });

  it('reports violation for job-level write-all permissions', () => {
    const ctx = makeContext({
      jobs: {
        build: {
          permissions: 'write-all',
          steps: [],
        },
      },
    });
    const violations = noWriteAllPermissions.check(ctx);
    expect(violations).toHaveLength(1);
    expect(violations[0].path).toBe('jobs.build.permissions');
  });

  it('passes when permissions are read-only', () => {
    const ctx = makeContext({
      permissions: { contents: 'read', issues: 'read' },
      jobs: {},
    });
    const violations = noWriteAllPermissions.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('passes when no permissions are defined', () => {
    const ctx = makeContext({ jobs: {} });
    const violations = noWriteAllPermissions.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('reports multiple violations across jobs', () => {
    const ctx = makeContext({
      jobs: {
        build: { permissions: { contents: 'write' }, steps: [] },
        deploy: { permissions: { packages: 'write' }, steps: [] },
      },
    });
    const violations = noWriteAllPermissions.check(ctx);
    expect(violations).toHaveLength(2);
  });
});
