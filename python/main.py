from flask import Flask, request, jsonify
from analyzeprofile import analyze_profile
from preprocess import preprocess_user
from resumeparser import parse_resume
import uuid
import logging
import tempfile
import os

app = Flask(__name__)

# Configure logging to see request flow
logging.basicConfig(level=logging.INFO)

# Suppress verbose Flask logs
log = logging.getLogger("werkzeug")
log.setLevel(logging.WARNING)


@app.route("/preprocess", methods=["POST"])
def preprocess():
    request_id = str(uuid.uuid4())[:8]
    print(f"\n🔴 [REQ-{request_id}] PREPROCESS START")

    try:
        data = request.get_json()
        user_id = data.get("userId")

        if not user_id:
            return jsonify({"error": "Missing userId"}), 400

        result = preprocess_user(user_id)

        print(f"🟢 [REQ-{request_id}] PREPROCESS END\n")
        return jsonify(result)

    except Exception as e:
        print(f"⚠️ [REQ-{request_id}] Preprocess Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/analyze-profile", methods=["POST"])
def analyze():
    request_id = str(uuid.uuid4())[:8]
    print(f"\n🔴 [REQ-{request_id}] ANALYSIS START")

    try:
        data = request.get_json()

        user_id = data.get("userId")
        job_role = data.get("jobRole", "")
        job_description = data.get("jobDescription", "")

        combined_job_text = f"{job_role}\n{job_description}".strip()

        if not user_id:
            return jsonify({"error": "Missing userId"}), 400

        result = analyze_profile(user_id, combined_job_text, job_role)

        print(f"🟢 [REQ-{request_id}] ANALYSIS END\n")

        return jsonify(result)

    except Exception as e:
        print(f"⚠️ [REQ-{request_id}] Analysis Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/parse-resume", methods=["POST"])
def resume():
    """
    Accept resume as multipart/form-data instead of filePath.
    """

    try:
        if "resume" not in request.files:
            return jsonify({
                "success": False,
                "error": "No resume file received"
            }), 400

        uploaded_file = request.files["resume"]

        if uploaded_file.filename == "":
            return jsonify({
                "success": False,
                "error": "Empty filename"
            }), 400

        suffix = os.path.splitext(uploaded_file.filename)[1] or ".pdf"

        temp_file = tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        )

        uploaded_file.save(temp_file.name)
        temp_file.close()

        try:
            result = parse_resume(temp_file.name)

            return jsonify({
                "success": True,
                "data": result
            })

        finally:
            if os.path.exists(temp_file.name):
                os.remove(temp_file.name)

    except Exception as e:
        print("Resume parsing error:", str(e))
        import traceback
        traceback.print_exc()

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "Python Flask API is running"
    })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=8000,
        debug=False,
        use_reloader=False,
    )