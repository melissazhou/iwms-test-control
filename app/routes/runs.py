import json
from flask import Blueprint, jsonify, request, current_app
from app.services.case_registry import get_case, render_command
from app.services.runner import start_run, refresh_run, stop_run, tail_log
from app.services.results_parser import parse_playwright_results
from app.db import get_db

bp = Blueprint('runs', __name__)


def _insert_run(r):
    db = get_db()
    db.execute('''
        INSERT INTO runs (id, case_id, command, env_name, params_json, status, pid, started_at, ended_at, exit_code, log_path, summary_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (r['id'], r['case_id'], r['command'], r['env_name'], r['params_json'], r['status'], r['pid'], r['started_at'], r['ended_at'], r['exit_code'], r['log_path'], r.get('summary_json')))
    db.commit()


def _update_run(r):
    db = get_db()
    db.execute('''
        UPDATE runs SET status=?, ended_at=?, exit_code=?, summary_json=? WHERE id=?
    ''', (r['status'], r.get('ended_at'), r.get('exit_code'), r.get('summary_json'), r['id']))
    db.commit()


@bp.post('/')
def create_run():
    body = request.get_json(force=True)
    case_id = body.get('case_id')
    env_name = body.get('env') or current_app.config['DEFAULT_TEST_ENV']
    params = body.get('params') or {}

    case_obj = get_case(case_id)
    if not case_obj:
        return jsonify({'ok': False, 'error': 'case not found'}), 404

    cmd = render_command(case_obj, params)
    run = start_run(case_id, cmd, env_name, params)
    _insert_run(run)
    return jsonify({'ok': True, 'run': run})


@bp.get('/')
def list_runs():
    db = get_db()
    rows = db.execute('SELECT * FROM runs ORDER BY started_at DESC LIMIT 200').fetchall()
    runs = [dict(r) for r in rows]
    # refresh running states
    changed = False
    for r in runs:
        if r['status'] == 'running':
            nr = refresh_run(r)
            if nr['status'] != 'running':
                summary = parse_playwright_results(current_app.config['IWMSTEST_PROJECT_ROOT'])
                if summary:
                    nr['summary_json'] = json.dumps(summary)
                _update_run(nr)
                changed = True
    if changed:
        rows = db.execute('SELECT * FROM runs ORDER BY started_at DESC LIMIT 200').fetchall()
        runs = [dict(r) for r in rows]
    return jsonify({'runs': runs})


@bp.get('/<run_id>/log')
def run_log(run_id):
    db = get_db()
    row = db.execute('SELECT * FROM runs WHERE id=?', (run_id,)).fetchone()
    if not row:
        return jsonify({'ok': False, 'error': 'run not found'}), 404
    return jsonify({'ok': True, 'log': tail_log(row['log_path'])})


@bp.get('/<run_id>/summary')
def run_summary(run_id):
    db = get_db()
    row = db.execute('SELECT summary_json FROM runs WHERE id=?', (run_id,)).fetchone()
    if not row:
        return jsonify({'ok': False, 'error': 'run not found'}), 404
    sj = row['summary_json']
    return jsonify({'ok': True, 'summary': json.loads(sj) if sj else None})


@bp.post('/<run_id>/stop')
def run_stop(run_id):
    ok = stop_run(run_id)
    db = get_db()
    if ok:
        db.execute('UPDATE runs SET status=?, ended_at=? WHERE id=?', ('stopped', __import__('datetime').datetime.utcnow().isoformat(), run_id))
        db.commit()
    return jsonify({'ok': ok})
