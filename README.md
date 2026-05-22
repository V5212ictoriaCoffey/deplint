# deplint

A static analysis tool that checks GitHub Actions workflows for common misconfigurations and security anti-patterns.

## Installation

```bash
npm install -g deplint
```

## Usage

Run `deplint` against your workflow files:

```bash
deplint .github/workflows/
```

Or check a single file:

```bash
deplint .github/workflows/ci.yml
```

### Example Output

```
✖ .github/workflows/ci.yml
  line 14  WARN  Unpinned action: uses actions/checkout@v3 (pin to a commit SHA)
  line 27  ERR   Secret exposed in run step via environment variable
  line 43  WARN  pull_request_target used with checkout of untrusted code

2 errors, 1 warning
```

### Rules

deplint checks for issues such as:

- Unpinned third-party actions (should be pinned to a commit SHA)
- Use of `pull_request_target` with unsafe checkout patterns
- Secrets exposed through environment variables or logs
- Overly broad permissions on `GITHUB_TOKEN`
- Self-hosted runners used on public repositories

## Configuration

Add a `deplint.config.json` to your project root to enable or disable specific rules:

```json
{
  "rules": {
    "unpinned-actions": "error",
    "broad-permissions": "warn",
    "pull-request-target": "error"
  }
}
```

## License

MIT