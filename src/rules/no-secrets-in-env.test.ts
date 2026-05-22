import { noSecretsInEnv } from './no-secrets-in-env';
import { RuleContext } from './rule';

function makeContext(workflow: object): RuleContext {
  return {
    filePath: 'test-workflow.yml',
    workflow: workflow as any,
  };
}

describe('no-secrets-in-env', () => {
  it('flags hardcoded password at workflow level', () => {
    const ctx = makeContext({ env: { MY_PASSWORD: 'supersecret' }, jobs: {} });
    const violations = noSecretsInEnv.check(ctx);
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain('MY_PASSWORD');
  });

  it('allows secrets expression at workflow level', () => {
    const ctx = makeContext({ env: { MY_PASSWORD: '${{ secrets.MY_PASSWORD }}' }, jobs: {} });
    const violations = noSecretsInEnv.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('flags hardcoded api_key in job env', () => {
    const ctx = makeContext({
      jobs: {
        build: {
          env: { API_KEY: 'abc123' },
          steps: [],
        },
      },
    });
    const violations = noSecretsInEnv.check(ctx);
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain('API_KEY');
  });

  it('flags hardcoded secret in step env', () => {
    const ctx = makeContext({
      jobs: {
        build: {
          steps: [
            { env: { AUTH_TOKEN: 'mytoken123' } },
          ],
        },
      },
    });
    const violations = noSecretsInEnv.check(ctx);
    expect(violations).toHaveLength(1);
    expect(violations[0].severity).toBe('error');
  });

  it('does not flag non-sensitive env vars', () => {
    const ctx = makeContext({
      env: { NODE_ENV: 'production', LOG_LEVEL: 'info' },
      jobs: {},
    });
    const violations = noSecretsInEnv.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does not flag empty env blocks', () => {
    const ctx = makeContext({ jobs: { build: { steps: [{ env: {} }] } } });
    const violations = noSecretsInEnv.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('allows other expression references', () => {
    const ctx = makeContext({
      jobs: {
        build: {
          env: { ACCESS_TOKEN: '${{ env.SOME_TOKEN }}' },
          steps: [],
        },
      },
    });
    const violations = noSecretsInEnv.check(ctx);
    expect(violations).toHaveLength(0);
  });
});
