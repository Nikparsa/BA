from flask import Flask, request, jsonify
import os
import zipfile
import tempfile
import subprocess
import json
import shutil
import requests


def create_app():
    app = Flask(__name__)

    PORT = int(os.environ.get('PORT', '5001'))
    BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:3000')
    SUBMISSIONS_DIR = os.environ.get('SUBMISSIONS_DIR', '/data/submissions')
    RESULTS_DIR = os.environ.get('RESULTS_DIR', '/data/results')
    TASKS_DIR = os.environ.get('TASKS_DIR', '/tasks')

    os.makedirs(RESULTS_DIR, exist_ok=True)

    @app.route('/health', methods=['GET'])
    def health():
        return jsonify({"ok": True})

    @app.route('/run', methods=['POST'])
    def run():
        payload = request.get_json(force=True)
        submission_id = payload.get('submissionId')
        assignment_id = payload.get('assignmentId')
        filename = payload.get('filename')
        if not submission_id or not filename:
            return jsonify({'error': 'missing fields'}), 400

        submission_zip = os.path.join(SUBMISSIONS_DIR, filename)
        if not os.path.isfile(submission_zip):
            return jsonify({'error': 'file not found'}), 404

        workdir = tempfile.mkdtemp(prefix=f"run_{submission_id}_")
        try:
            with zipfile.ZipFile(submission_zip, 'r') as zf:
                zf.extractall(workdir)

            # For prototype: assume python tasks and pytest tests live under TASKS_DIR/<slug>
            # We need the slug; get from backend
            assignment = requests.get(f"{BACKEND_URL}/assignments").json()
            # naive: pick by id
            slug = None
            for a in assignment:
                if a['id'] == assignment_id:
                    slug = a['slug']
                    break
            if not slug:
                raise RuntimeError('assignment slug not found')

            task_dir = os.path.join(TASKS_DIR, slug)
            tests_dir = os.path.join(task_dir, 'tests')

            # Copy tests into workdir
            for name in os.listdir(tests_dir):
                src = os.path.join(tests_dir, name)
                dst = os.path.join(workdir, name)
                if os.path.isdir(src):
                    shutil.copytree(src, dst, dirs_exist_ok=True)
                else:
                    shutil.copy2(src, dst)

            # Run pytest and capture json report
            report_path = os.path.join(workdir, 'report.json')
            cmd = [
                'pytest', '-q', '--maxfail=1', '--disable-warnings',
                f'--json-report', f'--json-report-file={report_path}'
            ]
            env = os.environ.copy()
            proc = subprocess.run(cmd, cwd=workdir, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=55)

            # Parse report
            total = passed = 0
            feedback = ''
            if os.path.isfile(report_path):
                try:
                    with open(report_path, 'r', encoding='utf-8') as f:
                        rep = json.load(f)
                    total = rep.get('summary', {}).get('total', 0)
                    passed = rep.get('summary', {}).get('passed', 0)
                    # Basic feedback: list failures
                    failures = rep.get('tests', [])
                    failed_msgs = []
                    for t in failures:
                        if t.get('outcome') == 'failed':
                            failed_msgs.append(f"{t.get('nodeid')}: {t.get('call', {}).get('longrepr', '')}")
                    feedback = '\n'.join(failed_msgs)[:4000]
                except Exception:
                    feedback = proc.stderr[-1000:]
            else:
                feedback = proc.stderr[-1000:]

            score = (passed / total) if total else 0.0

            requests.post(f"{BACKEND_URL}/runner/callback", json={
                'submissionId': submission_id,
                'status': 'completed' if proc.returncode == 0 else 'completed',
                'score': score,
                'totalTests': total,
                'passedTests': passed,
                'feedback': feedback
            }, timeout=5)

            return jsonify({'ok': True})
        except Exception as e:
            requests.post(f"{BACKEND_URL}/runner/callback", json={
                'submissionId': submission_id,
                'status': 'failed',
                'score': 0,
                'totalTests': 0,
                'passedTests': 0,
                'feedback': str(e)
            }, timeout=5)
            return jsonify({'error': 'runner error'}), 500
        finally:
            shutil.rmtree(workdir, ignore_errors=True)

    return app


# Create the app instance for Flask to find
app = create_app()


def main():
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', '5001')))


if __name__ == '__main__':
    main()







