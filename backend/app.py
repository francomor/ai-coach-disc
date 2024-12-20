import json
import logging
import os
from datetime import datetime, timedelta, timezone
from typing import List

import bcrypt
from dotenv import load_dotenv
from flask import Flask, jsonify, redirect, request
from flask_admin import Admin, AdminIndexView
from flask_admin.contrib.sqla import ModelView
from flask_basicauth import BasicAuth
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
    unset_jwt_cookies,
)
from flask_sqlalchemy import SQLAlchemy
from werkzeug.exceptions import HTTPException
from werkzeug.wrappers import Response

from .ai_model import predict, process_pdf
from .models import (
    DB_URI,
    Base,
    FileStorage,
    Group,
    Message,
    OnboardingAnswer,
    Participant,
    ParticipantFile,
    PromptConfig,
    Question,
    User,
    UserGroup,
    UserGroupFile,
)

# Setup logging
logging.basicConfig(
    filename="app.log",
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)

load_dotenv()

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/*": {
            "origins": [
                "http://localhost:3000",  # Local development
                "http://ai-coach-thomas.s3-website-sa-east-1.amazonaws.com",  # Production
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "expose_headers": ["Authorization"],
            "supports_credentials": True,
        }
    },
)

app.config["JWT_SECRET_KEY"] = "please-remember-to-change-me"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=12)
app.config["JWT_TOKEN_LOCATION"] = ["headers"]
app.config["JWT_HEADER_NAME"] = "Authorization"
app.config["JWT_HEADER_TYPE"] = "Bearer"
jwt = JWTManager(app)

app.config["SQLALCHEMY_DATABASE_URI"] = DB_URI
db = SQLAlchemy(model_class=Base)
db.init_app(app)

app.config["UPLOAD_FOLDER"] = "data"

# Ensure the /data directory exists
if not os.path.exists(app.config["UPLOAD_FOLDER"]):
    os.makedirs(app.config["UPLOAD_FOLDER"])

# Initialize Flask-Admin
app.config["BASIC_AUTH_USERNAME"] = "franco_morero"
app.config["BASIC_AUTH_PASSWORD"] = "M(ZtZ2r29r#b"

basic_auth = BasicAuth(app)


class AuthException(HTTPException):
    def __init__(self, message):
        super().__init__(
            message,
            Response(
                "You could not be authenticated. Please refresh the page.",
                401,
                {"WWW-Authenticate": 'Basic realm="Login Required"'},
            ),
        )


class AuthenticatedModelView(ModelView):
    def is_accessible(self):
        if not basic_auth.authenticate():
            raise AuthException("Not authenticated.")
        else:
            return True

    def inaccessible_callback(self, name, **kwargs):
        return redirect(basic_auth.challenge())


class MyAdminIndexView(AdminIndexView):
    def is_accessible(self):
        if not basic_auth.authenticate():
            raise AuthException("Not authenticated.")
        else:
            return True

    def inaccessible_callback(self, name, **kwargs):
        return redirect(basic_auth.challenge())


admin = Admin(
    app, name="Admin Panel", template_mode="bootstrap4", index_view=MyAdminIndexView()
)
db_models = [
    Question,
    OnboardingAnswer,
    User,
    PromptConfig,
    Group,
    FileStorage,
    ParticipantFile,
    Participant,
    UserGroup,
    Message,
]
for db_model in db_models:
    admin.add_view(AuthenticatedModelView(db_model, db.session))


# Adding logging to requests
@app.before_request
def log_request_info():
    logging.info(f"Request Path: {request.path}")
    logging.info(f"Request Method: {request.method}")
    logging.info(f"Request Headers: {request.headers}")
    if request.is_json:
        logging.info(f"Request Body: {request.get_json()}")


@app.route("/token", methods=["POST"])
def create_token():
    username = request.json.get("username", None)
    password = request.json.get("password", None)

    user = db.session.query(User).filter_by(username=username).first()

    logging.info(f"Token request for user: {username}")

    if not user:
        logging.warning(f"User not found: {username}")
        return jsonify({"msg": "User not found"}), 401

    if not user.enabled:
        logging.warning(f"User disabled: {username}")
        return jsonify({"msg": "User disabled"}), 401

    if not bcrypt.checkpw(password.encode("utf-8"), user.password.encode("utf-8")):
        logging.warning(f"Wrong password for user: {username}")
        return jsonify({"msg": "Wrong password"}), 401

    access_token = create_access_token(identity=user.id)
    logging.info(f"Access token created for user: {username}")
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
@jwt_required()
def logout():
    response = jsonify({"msg": "logout successful"})
    unset_jwt_cookies(response)
    logging.info("User logged out successfully")
    return response


@app.route("/chat-history/<int:group_id>", methods=["GET"])
@jwt_required()
def get_group_chat_history(group_id):
    user_id = get_jwt_identity()
    user = db.session.query(User).filter_by(id=user_id).first()

    if not user:
        logging.warning(f"User not found: ID {user_id}")
        return jsonify({"msg": "User not found"}), 404

    offset = request.args.get("offset", 0, type=int)
    history = get_history(group_id, user_id, None, limit=10, offset=offset)

    response = []
    for message in history:
        participant_name = ""
        if message.message_type == "assistant":
            participant_name = "AI"
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
    logging.info(f"Chat history retrieved for group {group_id} by user {user_id}")
    return jsonify(response)


@app.route("/chat-history/<int:group_id>/<int:participant_id>", methods=["GET"])
@jwt_required()
def get_messages(group_id, participant_id):
    try:
        user_id = get_jwt_identity()
        user = db.session.query(User).filter_by(id=user_id).first()

        if not user:
            return jsonify({"msg": "User not found"}), 404

        # Validate participant exists in group
        participant = (
            db.session.query(Participant)
            .filter_by(id=participant_id, group_id=group_id, user_id=user_id)
            .first()
        )

        if not participant:
            return jsonify({"msg": "Invalid participant"}), 422

        offset = request.args.get("offset", 0, type=int)
        history = get_history(
            group_id, user_id, participant_id, limit=10, offset=offset
        )

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

    except Exception as e:
        logging.error(f"Error in get_messages: {str(e)}")
        return jsonify({"msg": "Server error"}), 500


@app.route("/send-message", methods=["POST"])
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

        if not group_id or not content:
            return jsonify({"msg": "Bad payload"}), 400

        # Check if the user has an uploaded file for this group
        user_group_file = (
            db.session.query(UserGroupFile)
            .filter_by(user_id=user_id, user_group_id=group_id)
            .order_by(UserGroupFile.id.desc())
            .first()
        )
        if not user_group_file:
            return jsonify({"msg": "No file uploaded for this group"}), 403

        participant_id = participant.get("id") if participant else None
        participant_name = participant.get("name") if participant else "AI"

        if participant_id:
            # Validate participant exists in group
            participant = (
                db.session.query(Participant)
                .filter_by(id=participant_id, group_id=group_id, user_id=user_id)
                .first()
            )

            if not participant:
                return jsonify({"msg": "Invalid participant"}), 422

            # Validate participant has an uploaded file
            participant_file = (
                db.session.query(ParticipantFile)
                .filter_by(participant_id=participant_id)
                .order_by(ParticipantFile.id.desc())
                .first()
            )
            if not participant_file:
                return jsonify({"msg": "No file uploaded for this participant"}), 403

            participant_processed_summary = participant_file.processed_summary
        else:
            participant_processed_summary = None
        # Save user's message
        new_user_message = Message(
            user_id=user_id,
            group_id=group_id,
            message_type="user",
            content=content,
            participant_id=participant_id,
        )
        db.session.add(new_user_message)
        db.session.commit()

        # Generate assistant's response based on the group-specific prompt
        processed_summary = user_group_file.processed_summary
        history = get_history(group_id, user_id, participant_id, limit=10)
        response_content = predict(
            history,
            group_id,
            processed_summary,
            db.session,
            participant_processed_summary,
        )

        new_participant_message = Message(
            user_id=user_id,
            group_id=group_id,
            participant_id=participant_id,
            message_type="assistant",
            content=response_content,
        )
        db.session.add(new_participant_message)
        db.session.commit()

        response_messages = [
            {
                "messageType": "user",
                "participantName": user.name,
                "message": new_user_message.content,
                "timestamp": new_user_message.timestamp.isoformat(),
                "participantId": participant_id,
            },
            {
                "messageType": "assistant",
                "participantName": participant_name,
                "message": response_content,
                "timestamp": new_participant_message.timestamp.isoformat(),
                "participantId": participant_id,
            },
        ]

        return jsonify({"response": True, "messages": response_messages})
    except Exception as e:
        logging.error(f"Error in send_message: {str(e)}")
        return str(e), 500


def get_history(
    group_id: int,
    user_id: int,
    participant_id: int = None,
    limit: int = 10,
    offset: int = 0,
) -> List[Message]:
    query = db.session.query(Message).filter_by(group_id=group_id, user_id=user_id)

    if participant_id is None:
        # Only retrieve messages without a participant if no participant_id is provided
        query = query.filter(Message.participant_id.is_(None))
    else:
        # Retrieve messages for the specific participant
        query = query.filter(Message.participant_id == participant_id)

    messages = (
        query.order_by(Message.timestamp.desc()).offset(offset).limit(limit).all()
    )
    return messages


@app.route("/user-groups", methods=["GET"])
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
                "urlSlug": group.url_slug,
                "participants": [
                    {
                        "id": p.id,
                        "name": p.name,
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
                "onboarding_complete": user.onboarding_complete,
            },
            "groups": result,
        }
    )


@app.route("/questions", methods=["GET"])
@jwt_required()
def get_questions():
    questions = db.session.query(Question).all()
    return jsonify([{"id": q.id, "text": q.text} for q in questions])


@app.route("/complete-onboarding", methods=["POST"])
@jwt_required()
def complete_onboarding():
    user_id = get_jwt_identity()
    user = db.session.query(User).filter_by(id=user_id).first()

    if not user:
        return jsonify({"msg": "User not found"}), 404

    user.onboarding_complete = True

    # Handle answers
    answers = request.json.get("answers")
    if answers:
        for item in answers:
            question_id = item.get("question_id")
            answer_text = item.get("answer")
            if question_id and answer_text:
                answer = OnboardingAnswer(
                    user_id=user_id, question_id=question_id, answer=answer_text
                )
                db.session.add(answer)

    db.session.commit()
    return jsonify({"msg": "Onboarding complete"}), 200


@app.route("/group/upload-file", methods=["POST"])
@jwt_required()
async def upload_group_file():
    user_id = get_jwt_identity()
    user_group_id = request.form.get("user_group_id", type=int)

    user_group = (
        db.session.query(UserGroup)
        .filter_by(user_id=user_id, group_id=user_group_id)
        .first()
    )
    if not user_group:
        logging.warning(f"User group not found or unauthorized: {user_group_id}")
        return jsonify({"msg": "User group not found or unauthorized"}), 404

    if "file" not in request.files:
        logging.warning(f"No file provided for user group: {user_group_id}")
        return jsonify({"msg": "No file provided"}), 400

    file = request.files["file"]

    if file.filename == "" or not file.filename.endswith(".pdf"):
        logging.warning(f"Invalid file type provided for user group: {user_group_id}")
        return jsonify({"msg": "Invalid file type; only PDFs allowed"}), 400

    user_folder = os.path.join(app.config["UPLOAD_FOLDER"], str(user_id))
    if not os.path.exists(user_folder):
        os.makedirs(user_folder)
    try:
        original_filename, new_file_storage, summary = await process_pdf(
            file, user_folder, user_group.group_id, db.session
        )

        new_user_group_file = UserGroupFile(
            user_group_id=user_group.group_id,
            user_id=user_id,
            file_storage_id=new_file_storage.id,
            processed_summary=summary,
        )
        db.session.add(new_user_group_file)
        db.session.commit()

        logging.info(f"File uploaded successfully for user group: {user_group_id}")
        return (
            jsonify(
                {"msg": "File uploaded successfully", "filename": original_filename}
            ),
            200,
        )

    except Exception as e:
        logging.error(f"Error processing PDF for user group {user_group_id}: {e}")
        return jsonify({"msg": "Failed to process PDF", "error": str(e)}), 500


@app.route("/group/file-history", methods=["GET"])
@jwt_required()
def file_history():
    user_id = get_jwt_identity()
    user_group_id = request.args.get("user_group_id", type=int)
    if not user_group_id:
        return jsonify({"msg": "User group ID is required"}), 400

    user_group = (
        db.session.query(UserGroup)
        .filter_by(user_id=user_id, group_id=user_group_id)
        .first()
    )
    if not user_group:
        return jsonify({"msg": "User group not found or unauthorized"}), 404

    files = (
        db.session.query(UserGroupFile)
        .join(FileStorage, UserGroupFile.file_storage_id == FileStorage.id)
        .filter(
            UserGroupFile.user_group_id == user_group_id,
            UserGroupFile.user_id == user_id,
        )
        .order_by(FileStorage.uploaded_at.desc())
        .limit(3)
        .all()
    )

    history = [
        {
            "file_url": file.file_storage.file_url,
            "file_name": file.file_storage.file_name,
            "uploaded_at": file.file_storage.uploaded_at,
        }
        for file in files
    ]

    return jsonify(history)


@app.route("/participants/upload-file", methods=["POST"])
@jwt_required()
async def upload_participant_file():
    user_id = get_jwt_identity()
    participant_id = request.form.get("participant_id", type=int)

    participant = (
        db.session.query(Participant)
        .filter_by(id=participant_id, user_id=user_id)
        .first()
    )
    if not participant:
        return jsonify({"msg": "Participant not found or unauthorized"}), 404

    if "file" not in request.files:
        return jsonify({"msg": "No file provided"}), 400

    file = request.files["file"]

    if file.filename == "" or not file.filename.endswith(".pdf"):
        return jsonify({"msg": "Invalid file type; only PDFs allowed"}), 400

    user_folder = os.path.join(
        app.config["UPLOAD_FOLDER"], str(user_id), str(participant_id)
    )
    if not os.path.exists(user_folder):
        os.makedirs(user_folder)
    try:
        original_filename, new_file_storage, summary = await process_pdf(
            file, user_folder, participant.group_id, db.session
        )

        # TODO: add a check to see if the file is DISC

        new_participant_file = ParticipantFile(
            participant_id=participant_id,
            file_storage_id=new_file_storage.id,
            processed_summary=summary,
        )
        db.session.add(new_participant_file)
        db.session.commit()

        return (
            jsonify(
                {"msg": "File uploaded successfully", "filename": original_filename}
            ),
            200,
        )

    except Exception as e:
        logging.error(f"Error processing PDF: {e}")
        return jsonify({"msg": "Failed to process PDF", "error": str(e)}), 500


@app.route("/participants/file-history", methods=["GET"])
@jwt_required()
def participant_file_history():
    user_id = get_jwt_identity()
    participant_id = request.args.get("participant_id", type=int)

    participant = (
        db.session.query(Participant)
        .filter_by(id=participant_id, user_id=user_id)
        .first()
    )
    if not participant:
        return jsonify({"msg": "Participant not found or unauthorized"}), 404

    files = (
        db.session.query(ParticipantFile)
        .join(FileStorage, ParticipantFile.file_storage_id == FileStorage.id)
        .filter(ParticipantFile.participant_id == participant_id)
        .order_by(FileStorage.uploaded_at.desc())
        .limit(3)
        .all()
    )
    print(files)

    history = [
        {
            "file_url": file.file_storage.file_url,
            "file_name": file.file_storage.file_name,
            "uploaded_at": file.file_storage.uploaded_at,
        }
        for file in files
    ]

    return jsonify(history)


@app.route("/participants/add", methods=["POST"])
@jwt_required()
def add_participant():
    user_id = get_jwt_identity()
    data = request.json

    # Validate required fields
    group_id = data.get("groupId")
    name = data.get("name")

    if not group_id or not name:
        return jsonify({"msg": "Group ID and name are required"}), 400

    # Validate name length
    if len(name) < 2 or len(name) > 20:
        return (
            jsonify({"msg": "Participant name must be between 2 and 20 characters"}),
            400,
        )

    # Check if group exists and belongs to the user
    user_group = (
        db.session.query(UserGroup)
        .filter_by(user_id=user_id, group_id=group_id)
        .first()
    )
    if not user_group:
        return jsonify({"msg": "Group not found or unauthorized"}), 403

    # Count the current number of participants in the group
    participant_count = (
        db.session.query(Participant)
        .filter_by(group_id=group_id, user_id=user_id)
        .count()
    )

    if participant_count >= 5:
        return (
            jsonify(
                {
                    "msg": "Participant limit reached. You cannot add more than 5 participants."
                }
            ),
            400,
        )

    # Create and save the new participant
    new_participant = Participant(
        user_id=user_id,
        group_id=group_id,
        name=name,
    )
    db.session.add(new_participant)
    db.session.commit()

    return (
        jsonify(
            {
                "msg": "Participant added successfully",
                "participant": {"id": new_participant.id, "name": new_participant.name},
            }
        ),
        201,
    )


@app.route("/participants/<int:group_id>", methods=["GET"])
@jwt_required()
def get_participants(group_id):
    user_id = get_jwt_identity()

    # Verify the user is part of the group
    user_group = (
        db.session.query(UserGroup)
        .filter_by(user_id=user_id, group_id=group_id)
        .first()
    )
    if not user_group:
        return jsonify({"msg": "Group not found or unauthorized"}), 403

    # Retrieve participants
    participants = (
        db.session.query(Participant)
        .filter_by(group_id=group_id, user_id=user_id)
        .all()
    )
    participants_data = [{"id": p.id, "name": p.name} for p in participants]

    return jsonify({"participants": participants_data})


@app.route("/participants/edit", methods=["PUT"])
@jwt_required()
def edit_participant():
    user_id = get_jwt_identity()
    data = request.json
    participant_id = data.get("participantId")
    new_name = data.get("name")

    if not participant_id or not new_name:
        return jsonify({"msg": "Participant ID and name are required"}), 400

    if len(new_name) < 2 or len(new_name) > 20:
        return jsonify({"msg": "Name must be between 2 and 20 characters"}), 400

    participant = (
        db.session.query(Participant)
        .filter_by(id=participant_id, user_id=user_id)
        .first()
    )

    if not participant:
        return jsonify({"msg": "Participant not found or unauthorized"}), 403

    participant.name = new_name
    db.session.commit()

    return jsonify({"msg": "Participant updated successfully"})


if __name__ == "__main__":
    app.run(debug=True)
