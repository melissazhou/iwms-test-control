from flask import Flask, render_template
from .config import Config
from .db import init_db
from .routes.health import bp as health_bp
from .routes.envs import bp as env_bp
from .routes.cases import bp as cases_bp
from .routes.runs import bp as runs_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    init_db(app)

    app.register_blueprint(health_bp, url_prefix='/api/health')
    app.register_blueprint(env_bp, url_prefix='/api/envs')
    app.register_blueprint(cases_bp, url_prefix='/api/cases')
    app.register_blueprint(runs_bp, url_prefix='/api/runs')

    @app.get('/')
    def index():
        return render_template('index.html')

    return app
