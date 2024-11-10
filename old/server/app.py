import json
import sqlite3
from datetime import datetime, timedelta, timezone

from flask import Flask, g, jsonify, request
from flask_cors import CORS, cross_origin
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
    unset_jwt_cookies,
)
from model import predict, process_pdf

app = Flask(__name__)
CORS(app)

app.config["JWT_SECRET_KEY"] = "please-remember-to-change-me"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=12)
jwt = JWTManager(app)

DATABASE = "database.db"


def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db


def init_db():
    with app.app_context():
        db = get_db()
        with app.open_resource("schema.sql", mode="r") as f:
            db.cursor().executescript(f.read())
        db.commit()


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()


@app.route("/token", methods=["POST"])
@cross_origin()
def create_token():
    username = request.json.get("username", None)
    password = request.json.get("password", None)
    if username != "hulk" or password != "hulk":
        return {"msg": "Wrong username or password"}, 401

    access_token = create_access_token(identity=username)
    response = {"access_token": access_token}
    return response


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
@cross_origin()
def logout():
    response = jsonify({"msg": "logout successful"})
    unset_jwt_cookies(response)
    return response


@app.route("/chat_completion", methods=["POST"])
@cross_origin()
@jwt_required()
def get_data():
    history = request.json
    # ai_persona = history[0].get('userName')
    db = get_db()
    cur = db.cursor()
    cur.execute("SELECT disc_data FROM pdf_file WHERE active = 1")
    pdf_files = cur.fetchall()
    if pdf_files:
        disc_data = pdf_files[0]["disc_data"]
    else:
        print("No active pdf file")
        return jsonify({"messages": ["Error: No active pdf file"], "response": False})
    try:
        response = predict(history, disc_data)
        history_str = ""
        for hist in history:
            history_str += (
                f"/n/n/n ---- {hist['userType']} ---- /n/n/n" f"{hist['message']}"
            )
        print(history_str)
        cur.execute(
            "INSERT INTO messages_log (history, messages) VALUES (?, ?)",
            (history_str, response),
        )
        db.commit()
        return jsonify({"response": True, "messages": [response]})
    except Exception as e:
        print(e)
        error_message = f"Error: {str(e)}"
        return jsonify({"message": error_message, "response": False})


@app.route("/pdf_file_name", methods=["GET"])
@cross_origin()
@jwt_required()
def get_pdf_file_name():
    db = get_db()
    cur = db.cursor()
    cur.execute("SELECT original_file_name FROM pdf_file WHERE active = 1")
    pdf_files = cur.fetchall()
    pdf_files = [dict(row) for row in pdf_files]
    if pdf_files:
        pdf_file_name = pdf_files[0]["original_file_name"]
    else:
        pdf_file_name = ""
    print(pdf_file_name)
    return jsonify({"pdf_file_name": pdf_file_name})


@app.route("/clear_pdf_select", methods=["POST"])
@cross_origin()
@jwt_required()
def clear_pdf_select():
    db = get_db()
    cur = db.cursor()
    cur.execute("UPDATE pdf_file SET active = 0")
    db.commit()
    return jsonify({"status": 1})


@app.route("/upload_pdf", methods=["POST"])
@cross_origin()
@jwt_required()
def upload_file():
    """Handles the upload of a file."""
    db = get_db()
    cur = db.cursor()
    cur.execute("UPDATE pdf_file SET active = 0")
    db.commit()
    d = {}
    try:
        file = request.files["file"]
        filename = file.filename
        print(f"Uploading file {filename}")
        file_bytes = file.read()
        new_file_name, disc_data = process_pdf(file_bytes)
        cur.execute(
            "INSERT INTO pdf_file "
            "(file_name, disc_data, active, original_file_name) "
            "VALUES (?, ?, ?, ?)",
            (new_file_name, disc_data, 1, filename),
        )
        db.commit()
        d["status"] = 1
        d["pdf_file_name"] = filename

    except Exception as e:
        print(f"Couldn't upload file {e}")
        d["status"] = 0

    return jsonify(d)


if __name__ == "__main__":
    app.run(debug=True)
