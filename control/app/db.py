import os
import sqlite3
from flask import g


def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(g.app.config['DB_PATH'])
        g.db.row_factory = sqlite3.Row
    return g.db


def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()


def init_schema(app):
    os.makedirs(os.path.dirname(app.config['DB_PATH']), exist_ok=True)
    conn = sqlite3.connect(app.config['DB_PATH'])
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS runs (
            id TEXT PRIMARY KEY,
            case_id TEXT NOT NULL,
            command TEXT NOT NULL,
            env_name TEXT NOT NULL,
            params_json TEXT,
            status TEXT NOT NULL,
            pid INTEGER,
            started_at TEXT,
            ended_at TEXT,
            exit_code INTEGER,
            log_path TEXT,
            summary_json TEXT
        )
    ''')
    try:
        cur.execute("ALTER TABLE runs ADD COLUMN summary_json TEXT")
    except sqlite3.OperationalError:
        pass
    conn.commit()
    conn.close()


def init_db(app):
    init_schema(app)

    @app.before_request
    def bind_app_to_g():
        g.app = app

    app.teardown_appcontext(close_db)
