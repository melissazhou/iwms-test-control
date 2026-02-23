from flask import Blueprint, jsonify
from app.services.case_registry import list_cases

bp = Blueprint('cases', __name__)


@bp.get('/')
def cases():
    return jsonify({'cases': list_cases()})
