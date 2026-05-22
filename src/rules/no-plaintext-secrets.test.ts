import { noPlaintextSecrets } from './no-plaintext-secrets';
import { RuleContext } from './rule';

function makeContext(workflow: Record<string, unknown>): RuleContext {
  return { file: 'test.yml', workflow };
}

describe('no-plaintext-secrets rule', () => {
  it('returns no violations for a clean workflow', () => {
    const ctx = makeContext({
      jobs: {
        build: {
          steps: [{ run: 'echo hello' }],
        },
      },
    });
    expect(noPlaintextSecrets.check(ctx)).toHaveLength(0);
  });

  it('detects a plaintext password in an env block', () => {
    const ctx = makeContext({
      env: { password: 'supersecret123' },
    });
    const violations = noPlaintextSecrets.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('no-plaintext-secrets');
    expect(violations[0].severity).toBe('error');
  });

  it('does not flag a secret reference using ${{ secrets.* }}', () => {
    const ctx = makeContext({
      env: { token: '${{ secrets.MY_TOKEN }}' },
    });
    expect(noPlaintextSecrets.check(ctx)).toHaveLength(0);
  });

  it('detects an api_key with a literal value', () => {
    const ctx = makeContext({
      jobs: { deploy: { env: { api_key: 'abc123xyz' } } },
    });
    const violations = noPlaintextSecrets.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
  });

  it('has correct metadata', () => {
    expect(noPlaintextSecrets.id).toBe('no-plaintext-secrets');
    expect(noPlaintextSecrets.severity).toBe('error');
    expect(typeof noPlaintextSecrets.description).toBe('string');
  });
});
