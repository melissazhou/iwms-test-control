# Command Runner Bridge

Purpose: execute npm/npx/node commands on host even when OpenClaw exec output is unstable.

## One-time install (user)
```bat
cd /d D:\Project\IWMSTEST
tools\runner\install-runner-task.bat
```

## How assistant uses it
- Put job file in `tools/runner/queue/*.json`
- Runner executes command and writes:
  - log: `test-results/runner-logs/*.log`
  - result: `tools/runner/done/*.result.json`

Job schema:
```json
{ "id": "job-001", "env": "uat", "command": "npm run test:smoke" }
```

Allowed commands: `npm ...`, `npx ...`, `node ...`.
