import json
from datetime import datetime, timedelta, timezone
from typing import List

import bcrypt
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
    unset_jwt_cookies,
)
from flask_sqlalchemy import SQLAlchemy

from database_models import DB_URI, Base, Group, Message, Participant, User, UserGroup
from model import predict

load_dotenv()

app = Flask(__name__)
CORS(app, support_credentials=True)

app.config["JWT_SECRET_KEY"] = "please-remember-to-change-me"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=12)
jwt = JWTManager(app)

app.config["SQLALCHEMY_DATABASE_URI"] = DB_URI
db = SQLAlchemy(model_class=Base)
db.init_app(app)


@app.route("/token", methods=["POST"])
@cross_origin(support_credentials=True)
def create_token():
    username = request.json.get("username", None)
    password = request.json.get("password", None)

    user = db.session.query(User).filter_by(username=username).first()

    if not user:
        return jsonify({"msg": "User not found"}), 401

    if not bcrypt.checkpw(password.encode("utf-8"), user.password.encode("utf-8")):
        return jsonify({"msg": "Wrong password"}), 401

    access_token = create_access_token(identity=user.id)
    return jsonify({"access_token": access_token})


@app.after_request
def refresh_expiring_jwts(response):
    try:
        exp_timestamp = get_jwt()["exp"]
        now = datetime.now(timezone.utc)
        target_timestamp = datetime.timestamp(now + timedelta(minutes=30))
        if target_timestamp > exp_timestamp:
            access_token = create_access_token(identity=get_jwt_identity())
            data = response.get_json()
            if type(data) is dict:
                data["access_token"] = access_token
                response.data = json.dumps(data)
        return response
    except (RuntimeError, KeyError):
        # Case where there is not a valid JWT. Just return the original response
        return response


@app.route("/logout", methods=["POST"])
@cross_origin(support_credentials=True)
@jwt_required()
def logout():
    response = jsonify({"msg": "logout successful"})
    unset_jwt_cookies(response)
    return response


@app.route("/chat_history/<int:group_id>/<int:participant_id>", methods=["GET"])
@cross_origin(support_credentials=True)
@jwt_required()
def get_messages(group_id, participant_id):
    user_id = get_jwt_identity()
    user = db.session.query(User).filter_by(id=user_id).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    offset = request.args.get("offset", 0, type=int)
    history = get_history(group_id, user_id, participant_id, limit=10, offset=offset)
    response = []
    for message in history:
        participant_name = ""
        if message.message_type == "assistant":
            participant_name = message.participant.name
        elif message.message_type == "user":
            participant_name = user.name
        response.append(
            {
                "messageType": message.message_type,
                "participantName": participant_name,
                "message": message.content,
                "timestamp": message.timestamp.isoformat(),
            }
        )
    return jsonify(response)


@app.route("/send_message", methods=["POST"])
@cross_origin(support_credentials=True)
@jwt_required()
def send_message():
    try:
        user_id = get_jwt_identity()
        user = db.session.query(User).filter_by(id=user_id).first()
        if not user:
            return jsonify({"msg": "User not found"}), 404
        data = request.json
        group_id = data.get("groupId")
        content = data.get("content")
        participant = data.get("participant")

        if not group_id or not content or not participant:
            return jsonify({"msg": "Bad payload"}), 400

        new_user_message = Message(
            user_id=user_id,
            group_id=group_id,
            message_type="user",
            content=content,
            participant_id=participant.get("id"),
        )
        db.session.add(new_user_message)
        db.session.commit()

        # Generate responses for participant
        history = get_history(group_id, user_id, limit=10)
        response_messages = []

        participant_name = participant.get("name")
        participant_id = participant.get("id")
        response_content = predict(history, participant_name)
        new_participant_message = Message(
            user_id=user_id,
            group_id=group_id,
            participant_id=participant_id,
            message_type="assistant",
            content=response_content,
        )
        db.session.add(new_participant_message)
        db.session.commit()

        response_messages.append(
            {
                "messageType": "assistant",
                "participantName": participant_name,
                "message": response_content,
                "timestamp": new_participant_message.timestamp.isoformat(),
                "participantId": participant_id,
            }
        )

        # Include user's message in response, specifying the participantId
        response_messages.insert(
            0,
            {
                "messageType": "user",
                "participantName": user.name,
                "message": new_user_message.content,
                "timestamp": new_user_message.timestamp.isoformat(),
                "participantId": participant_id,
            },
        )

        return jsonify({"response": True, "messages": response_messages})
    except Exception as e:
        return str(e), 500


def get_history(
    group_id: int,
    user_id: int,
    participant_id: int = None,
    limit: int = 10,
    offset: int = 0,
) -> List[Message]:
    query = db.session.query(Message).filter_by(group_id=group_id, user_id=user_id)
    if participant_id:
        query = query.filter(
            (Message.participant_id == participant_id)
            | (Message.participant_id._is(None))
        )
    messages = (
        query.order_by(Message.timestamp.desc()).offset(offset).limit(limit).all()
    )
    return messages


@app.route("/user_groups", methods=["GET"])
@cross_origin(support_credentials=True)
@jwt_required()
def get_user_groups():
    user_id = get_jwt_identity()
    user = db.session.query(User).filter_by(id=user_id).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    groups = (
        db.session.query(Group)
        .join(UserGroup)
        .filter(UserGroup.user_id == user.id)
        .all()
    )

    result = []
    for group in groups:
        participants = (
            db.session.query(Participant)
            .filter_by(user_id=user.id, group_id=group.id)
            .all()
        )
        result.append(
            {
                "id": group.id,
                "name": group.name,
                "image": group.image,
                "participants": [
                    {
                        "id": p.id,
                        "name": p.name,
                        "roleDocument": p.role_document,
                    }
                    for p in participants
                ],
            }
        )
    return jsonify(
        {
            "userData": {
                "id": user.id,
                "name": user.name,
                "username": user.username,
            },
            "groups": result,
        }
    )


if __name__ == "__main__":
    app.run(debug=True)
