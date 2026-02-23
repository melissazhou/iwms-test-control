import os
import json
import uuid
import socket
import subprocess
from urllib.parse import urlparse
from datetime import datetime
from flask import current_app

RUNNING = {}


def _now():
    return datetime.utcnow().isoformat()


def _safe_name(name: str):
    return ''.join(ch if ch.isalnum() or ch in '-_' else '_' for ch in name)


def _parse_env_file(project_root: str, env_name: str):
    fp = os.path.join(project_root, f'.env.{env_name}')
    data = {}
    if not os.path.exists(fp):
        return data
    with open(fp, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            data[k.strip()] = v.strip().strip('"').strip("'")
    return data


def _tcp_ok(host: str, port: int, timeout: float = 4.0):
    try:
        with socket.create_connection((host, int(port)), timeout=timeout):
            return True, ''
    except Exception as e:
        return False, str(e)


def _preflight_checks(env_name: str):
    project_root = current_app.config['IWMSTEST_PROJECT_ROOT']
    envs = _parse_env_file(project_root, env_name)

    checks = []
    base = envs.get('BASE_URL')
    api = envs.get('API_BASE_URL')
    db_host = envs.get('DB_HOST')
    db_port = int(envs.get('DB_PORT', '1521'))

    if base:
        u = urlparse(base)
        checks.append(('BASE_URL', u.hostname, u.port or 443))
    if api:
        u = urlparse(api)
        checks.append(('API_BASE_URL', u.hostname, u.port or 443))
    if db_host:
        checks.append(('DB', db_host, db_port))

    results = []
    failed = []
    for name, host, port in checks:
        ok, err = _tcp_ok(host, port)
        row = {'name': name, 'host': host, 'port': port, 'ok': ok, 'error': err}
        results.append(row)
        if not ok:
            failed.append(row)
    return results, failed


def start_run(case_id: str, command: str, env_name: str, params: dict):
    run_id = str(uuid.uuid4())
    log_dir = current_app.config['LOG_DIR']
    os.makedirs(log_dir, exist_ok=True)
    log_path = os.path.join(log_dir, f"{_safe_name(case_id)}-{run_id}.log")

    f = open(log_path, 'a', encoding='utf-8')
    f.write(f"=== {case_id} ===\n")
    f.write(f"Started: {_now()}\n")
    f.write(f"Env: {env_name}\n")
    f.write(f"Command: {command}\n\n")

    pre_results, pre_failed = _preflight_checks(env_name)
    f.write('[Preflight]\n')
    for r in pre_results:
        f.write(f"- {r['name']}: {r['host']}:{r['port']} => {'OK' if r['ok'] else 'FAIL'}")
        if r['error']:
            f.write(f" ({r['error']})")
        f.write('\n')
    f.write('\n')
    f.flush()

    if pre_failed:
        f.write('[FAIL-FAST] Connectivity preflight failed. Run aborted.\n')
        f.close()
        return {
            'id': run_id,
            'case_id': case_id,
            'command': command,
            'env_name': env_name,
            'params_json': json.dumps(params or {}),
            'status': 'failed',
            'pid': None,
            'started_at': _now(),
            'ended_at': _now(),
            'exit_code': -2,
            'log_path': log_path,
            'summary_json': json.dumps({'preflightFailed': pre_failed})
        }

    env = os.environ.copy()
    env['TEST_ENV'] = env_name

    proc = subprocess.Popen(
        command,
        cwd=current_app.config['IWMSTEST_PROJECT_ROOT'],
        shell=True,
        stdout=f,
        stderr=f,
        env=env,
        text=True
    )

    RUNNING[run_id] = {'proc': proc, 'log_path': log_path, 'file': f}
    return {
        'id': run_id,
        'case_id': case_id,
        'command': command,
        'env_name': env_name,
        'params_json': json.dumps(params or {}),
        'status': 'running',
        'pid': proc.pid,
        'started_at': _now(),
        'ended_at': None,
        'exit_code': None,
        'log_path': log_path,
        'summary_json': None
    }


def refresh_run(run):
    rid = run['id']
    if rid not in RUNNING:
        return run

    proc = RUNNING[rid]['proc']
    code = proc.poll()
    if code is None:
        return run

    run['status'] = 'passed' if code == 0 else 'failed'
    run['exit_code'] = code
    run['ended_at'] = _now()

    RUNNING[rid]['file'].write(f"\nEnded: {run['ended_at']}\nExitCode: {code}\n")
    RUNNING[rid]['file'].close()
    RUNNING.pop(rid, None)
    return run


def stop_run(run_id: str):
    item = RUNNING.get(run_id)
    if not item:
        return False
    item['proc'].kill()
    return True


def tail_log(log_path: str, max_chars: int = 12000):
    if not os.path.exists(log_path):
        return ''
    with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
        data = f.read()
    return data[-max_chars:]
