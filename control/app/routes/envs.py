import os
from flask import Blueprint, jsonify, current_app

bp = Blueprint('envs', __name__)


@bp.get('/')
def list_envs():
    root = current_app.config['IWMSTEST_PROJECT_ROOT']
    env_files = []
    if os.path.isdir(root):
        for f in os.listdir(root):
            if f.startswith('.env.'):
                env_files.append(f.replace('.env.', ''))
    return jsonify({
        'default': current_app.config['DEFAULT_TEST_ENV'],
        'envs': sorted(env_files)
    })
