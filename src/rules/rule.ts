export type Severity = 'error' | 'warning' | 'info';

export interface RuleViolation {
  message: string;
  path: string;
  severity: Severity;
}

export interface RuleContext {
  workflow: {
    name?: string;
    on?: unknown;
    permissions?: unknown;
    jobs?: Record<string, unknown>;
    env?: Record<string, unknown>;
  };
  filePath: string;
}

export interface Rule {
  id: string;
  description: string;
  severity: Severity;
  check(context: RuleContext): RuleViolation[];
}
