from flask import Flask, request, jsonify
from analyzeprofile import analyze_profile
from preprocess import preprocess_user
from resumeparser import parse_resume
import uuid
import logging

app = Flask(__name__)

# Configure logging to see request flow
logging.basicConfig(level=logging.INFO)

# Suppress verbose Flask logs
log = logging.getLogger('werkzeug')
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
        print(f"⚠️  [REQ-{request_id}] Preprocess Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "success": False}), 500


@app.route("/analyze-profile", methods=["POST"])
def analyze():
    request_id = str(uuid.uuid4())[:8]
    print(f"\n🔴 [REQ-{request_id}] ANALYSIS START")
    data = request.get_json()
    user_id = data.get("userId")
    job_role = data.get("jobRole", "")
    job_description = data.get("jobDescription", "")
    
    # Combine job role and description for better skill extraction
    combined_job_text = f"{job_role}\n{job_description}".strip()

    if not user_id:
        return jsonify({"error": "Missing userId"}), 400

    result = analyze_profile(user_id, combined_job_text, job_role)
    print(f"🟢 [REQ-{request_id}] ANALYSIS END\n")
    return jsonify(result)


@app.route("/parse-resume", methods=["POST"])
def resume():
    data = request.get_json()
    file_path = data.get("filePath")

    if not file_path:
        return jsonify({"error": "Missing filePath"}), 400

    result = parse_resume(file_path)
    return jsonify({
        "success": True,
        "data": result
    })


@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "Python Flask API is running"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False, use_reloader=False)
