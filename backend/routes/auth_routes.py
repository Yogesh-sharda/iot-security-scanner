from flask import Blueprint, request, jsonify, current_app
from models import db, User
from utils.security import hash_password, verify_password
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from utils.validators import RegisterSchema, LoginSchema
from marshmallow import ValidationError
import logging

auth_bp = Blueprint('auth', __name__)

register_schema = RegisterSchema()
login_schema = LoginSchema()

@auth_bp.route('/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Invalid JSON"}), 400
        
    try:
        validated_data = register_schema.load(data)
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    username = validated_data['username']
    password = validated_data['password']
    role = validated_data['role']

    if User.query.filter_by(username=username).first():
        current_app.logger.warning(f"Registration failed: Username '{username}' already exists.")
        return jsonify({"msg": "Username already exists"}), 400

    hashed_pw = hash_password(password)
    new_user = User(username=username, password=hashed_pw, role=role)
    
    try:
        db.session.add(new_user)
        db.session.commit()
        current_app.logger.info(f"User registered successfully: {username} ({role})")
        return jsonify({"msg": "User created successfully"}), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error during registration for '{username}': {e}")
        return jsonify({"msg": "Internal server error"}), 500

@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Invalid JSON"}), 400
        
    try:
        validated_data = login_schema.load(data)
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    username = validated_data['username']
    password = validated_data['password']

    user = User.query.filter_by(username=username).first()

    if not user or not verify_password(user.password, password):
        current_app.logger.warning(f"Failed login attempt for username: {username}")
        return jsonify({"msg": "Invalid username or password"}), 401

    # Flask-JWT-Extended expects the JWT "sub"/identity to be a STRING.
    # Put the remaining user context into JWT claims.
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "username": user.username},
    )
    refresh_token = create_refresh_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "username": user.username},
    )
    
    current_app.logger.info(f"User logged in: {username}")
    return jsonify(access_token=access_token, refresh_token=refresh_token, role=user.role, username=user.username), 200

@auth_bp.route('/refresh', methods=['POST', 'OPTIONS'])
@jwt_required(refresh=True)
def refresh():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    user_id = get_jwt_identity()
    claims = get_jwt()
    new_access_token = create_access_token(
        identity=user_id,
        additional_claims={
            "role": claims.get("role"),
            "username": claims.get("username"),
        },
    )
    current_app.logger.info(f"Token refreshed for user: {claims.get('username')}")
    return jsonify(access_token=new_access_token), 200

@auth_bp.route('/me', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_current_user():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    user_id = get_jwt_identity()
    claims = get_jwt()
    return jsonify({"id": user_id, **claims}), 200
