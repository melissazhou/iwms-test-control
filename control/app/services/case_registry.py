CASES = [
    {
        'id': 'rf-smoke',
        'name': 'RF Smoke',
        'type': 'rf',
        'command_template': 'npx playwright test tests/smoke/rf-login.spec.ts --project=smoke',
        'params': []
    },
    {
        'id': 'web-smoke',
        'name': 'Web Smoke',
        'type': 'web',
        'command_template': 'npx playwright test tests/smoke/web-login.spec.ts --project=smoke',
        'params': []
    },
    {
        'id': 'api-smoke',
        'name': 'API Smoke',
        'type': 'api',
        'command_template': 'npx playwright test tests/smoke/api-login.spec.ts --project=smoke',
        'params': []
    },
    {
        'id': 'so-by-no',
        'name': 'SO Flow by SO No',
        'type': 'flow',
        'command_template': 'npx playwright test tests/e2e/so-full-flow.spec.ts --project=e2e --grep "{SO_NO}"',
        'params': ['SO_NO']
    },
    {
        'id': 'wo-by-no',
        'name': 'WO Flow by WO No',
        'type': 'flow',
        'command_template': 'npx playwright test tests/e2e/wo-flow.spec.ts --project=e2e --grep "{WO_NO}"',
        'params': ['WO_NO']
    },
    {
        'id': 'db-check',
        'name': 'Database Health Check',
        'type': 'ops',
        'command_template': 'npm run db:check',
        'params': []
    },
    {
        'id': 'env-check',
        'name': 'Environment Health Check',
        'type': 'ops',
        'command_template': 'npm run env:check',
        'params': []
    }
]


def list_cases():
    return CASES


def get_case(case_id: str):
    for c in CASES:
        if c['id'] == case_id:
            return c
    return None


def render_command(case_obj, params: dict):
    cmd = case_obj['command_template']
    for key in case_obj.get('params', []):
        value = (params or {}).get(key, '')
        cmd = cmd.replace('{' + key + '}', str(value))
    return cmd
