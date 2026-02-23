import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key')
    APP_PORT = int(os.getenv('APP_PORT', '5077'))
    DB_PATH = os.getenv('DB_PATH', './data/app.db')
    LOG_DIR = os.getenv('LOG_DIR', './data/logs')
    IWMSTEST_PROJECT_ROOT = os.getenv('IWMSTEST_PROJECT_ROOT', '/opt/IWMSTEST')
    DEFAULT_TEST_ENV = os.getenv('DEFAULT_TEST_ENV', 'uat')
