from flask import Flask, request, jsonify
import os
import zipfile
import tempfile
import subprocess
import json
import shutil
import requests
from language_plugins import plugin_manager

app = Flask(__name__)

PORT = int(os.getenv('PORT', 5001))
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:3000/api')

# Get absolute paths relative to this file
RUNNER_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(RUNNER_DIR)
SUBMISSIONS_DIR = os.path.join(PROJECT_ROOT, 'backend', 'src', 'data', 'submissions')
RESULTS_DIR = os.path.join(PROJECT_ROOT, 'backend', 'src', 'data', 'results')
TASKS_DIR = os.path.join(PROJECT_ROOT, 'tasks')
CUSTOM_TASKS_DIR = os.path.join(PROJECT_ROOT, 'backend', 'src', 'data', 'tests')
os.makedirs(CUSTOM_TASKS_DIR, exist_ok=True)

os.makedirs(RESULTS_DIR, exist_ok=True)

def run_pytest(workdir, test_dir):
    """Run pytest and return results"""
    report_path = os.path.join(workdir, 'report.json')
    
    cmd = [
        'python', '-m', 'pytest',
        '-q',
        '--disable-warnings',
        '--json-report',
        f'--json-report-file={report_path}',
        test_dir
    ]
    
    try:
        result = subprocess.run(
            cmd,
            cwd=workdir,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        # Parse results
        total_tests = 0
        passed_tests = 0
        failed_tests = 0
        feedback = ""
        
        if os.path.exists(report_path):
            try:
                with open(report_path, 'r') as f:
                    report = json.load(f)
                
                summary = report.get('summary', {})
                total_tests = summary.get('total', 0)
                passed_tests = summary.get('passed', 0)
                failed_tests = summary.get('failed', 0)
                
                # Generate feedback from failed tests
                tests = report.get('tests', [])
                failed_tests_list = [t for t in tests if t.get('outcome') == 'failed']
                
                if failed_tests_list:
                    feedback_parts = ["Failed tests:"]
                    for test in failed_tests_list[:3]:  # Limit to first 3 failures
                        nodeid = test.get('nodeid', 'Unknown test')
                        longrepr = test.get('call', {}).get('longrepr', '')
                        if longrepr:
                            lines = longrepr.split('\n')
                            error_line = next((line for line in lines if 'AssertionError' in line), lines[0] if lines else '')
                            feedback_parts.append(f"  • {nodeid}: {error_line}")
                    feedback = '\n'.join(feedback_parts)
                else:
                    feedback = f"All {passed_tests} tests passed!"
                    
            except (json.JSONDecodeError, IOError) as e:
                feedback = f"Failed to parse test results: {str(e)}"
        else:
            feedback = result.stderr or "Test execution completed but no report generated"
        
        score = passed_tests / total_tests if total_tests > 0 else 0.0
        
        return {
            'success': result.returncode == 0,
            'total_tests': total_tests,
            'passed_tests': passed_tests,
            'failed_tests': failed_tests,
            'score': score,
            'feedback': feedback
        }
        
    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'total_tests': 0,
            'passed_tests': 0,
            'failed_tests': 0,
            'score': 0.0,
            'feedback': 'Test execution timed out after 60 seconds'
        }
    except Exception as e:
        return {
            'success': False,
            'total_tests': 0,
            'passed_tests': 0,
            'failed_tests': 0,
            'score': 0.0,
            'feedback': f'Test execution failed: {str(e)}'
        }

print("DEBUG: About to register /health route")  # Debug before route
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "ok": True,
        "supported_languages": plugin_manager.get_supported_languages()
    })

@app.route('/languages', methods=['GET'])
def get_languages():
    """Get information about supported languages"""
    languages_info = {}
    for language in plugin_manager.get_supported_languages():
        languages_info[language] = plugin_manager.get_plugin_info(language)
    
    return jsonify({
        "supported_languages": plugin_manager.get_supported_languages(),
        "languages_info": languages_info
    })

print("DEBUG: About to register /run route")  # Debug before route
@app.route('/run', methods=['POST'])
def run():
    print("DEBUG: /run endpoint called")  # Debug line
    payload = request.get_json(force=True)
    submission_id = payload.get('submissionId')
    assignment_id = payload.get('assignmentId')
    filename = payload.get('filename')
    
    if not submission_id or not filename:
        return jsonify({'error': 'missing fields'}), 400

    submission_zip = os.path.join(SUBMISSIONS_DIR, filename)
    print(f"DEBUG: Looking for file: {submission_zip}")  # Debug
    print(f"DEBUG: File exists: {os.path.isfile(submission_zip)}")  # Debug
    if not os.path.isfile(submission_zip):
        return jsonify({'error': 'file not found', 'path': submission_zip}), 404

    workdir = tempfile.mkdtemp(prefix=f"run_{submission_id}_")
    print(f"DEBUG: Created workdir: {workdir}")  # Debug
    try:
        # Extract submission files
        print("DEBUG: Extracting ZIP file...")  # Debug
        with zipfile.ZipFile(submission_zip, 'r') as zf:
            zf.extractall(workdir)
        print("DEBUG: ZIP extracted successfully")  # Debug

        # Get assignment information
        try:
            assignment_response = requests.get(f"{BACKEND_URL}/runner/assignments")
            assignment_response.raise_for_status()
            assignments = assignment_response.json()
            print(f"DEBUG: Got assignments: {assignments}")  # Debug
            print(f"DEBUG: Assignments type: {type(assignments)}")  # Debug
        except Exception as e:
            raise RuntimeError(f'Failed to fetch assignment info: {e}')

        # Find assignment by ID
        assignment = None
        if isinstance(assignments, list):
            for a in assignments:
                if isinstance(a, dict) and a.get('id') == assignment_id:
                    assignment = a
                    break
        else:
            raise RuntimeError(f'Expected list of assignments, got {type(assignments)}')
        
        if not assignment:
            raise RuntimeError('Assignment not found')

        # Set up test directory
        task_dir = os.path.join(TASKS_DIR, assignment['slug'])
        if not os.path.exists(task_dir):
            task_dir = os.path.join(CUSTOM_TASKS_DIR, assignment['slug'])

        tests_dir = os.path.join(task_dir, 'tests')
        
        if not os.path.exists(tests_dir):
            raise RuntimeError(f'Test directory not found: {tests_dir}')

        # Copy test files to workdir
        for name in os.listdir(tests_dir):
            src = os.path.join(tests_dir, name)
            dst = os.path.join(workdir, name)
            if os.path.isdir(src):
                shutil.copytree(src, dst, dirs_exist_ok=True)
            else:
                shutil.copy2(src, dst)

        # Get extracted files list
        extracted_files = []
        for root, dirs, files in os.walk(workdir):
            for file in files:
                if not file.startswith('test_') and file.endswith('.py'):
                    extracted_files.append(file)

        # Determine language (from assignment or auto-detect)
        detected_language = assignment.get('language', 'python')
        if not detected_language:
            detected_language = plugin_manager.detect_language(extracted_files)
        
        if not detected_language:
            raise RuntimeError('Could not detect programming language')

        # Execute tests using language plugin (simplified for Python)
        print("DEBUG: About to run pytest...")  # Debug
        test_result = run_pytest(workdir, tests_dir)
        print(f"DEBUG: Test result: {test_result}")  # Debug

        # Prepare callback data
        callback_data = {
            'submissionId': submission_id,
            'status': 'completed' if test_result.get('success', False) else 'failed',
            'score': test_result.get('score', 0.0),
            'totalTests': test_result.get('total_tests', 0),
            'passedTests': test_result.get('passed_tests', 0),
            'feedback': test_result.get('feedback', ''),
            'language': 'python'
        }

        # Send results back to backend
        print(f"DEBUG: Sending callback to backend: {callback_data}")  # Debug
        try:
            callback_response = requests.post(f"{BACKEND_URL}/runner/callback", json=callback_data, timeout=5)
            print(f"DEBUG: Callback response: {callback_response.status_code}")  # Debug
        except Exception as e:
            print(f"Warning: Failed to send callback: {e}")

        return jsonify({
            'ok': True, 
            'language': 'python',
            'result': test_result
        })
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"DEBUG: Error occurred: {str(e)}")  # Debug
        print(f"DEBUG: Traceback:\n{error_trace}")  # Debug
        # Send error callback
        try:
            requests.post(f"{BACKEND_URL}/runner/callback", json={
                'submissionId': submission_id,
                'status': 'failed',
                'score': 0,
                'totalTests': 0,
                'passedTests': 0,
                'feedback': str(e),
                'language': 'python'
            }, timeout=5)
        except:
            pass
        
        return jsonify({'error': 'runner error', 'message': str(e)}), 500
    finally:
        shutil.rmtree(workdir, ignore_errors=True)

if __name__ == '__main__':
    print(f"Starting ACA Runner on port {PORT}")
    # Debug: Print all registered routes
    print("DEBUG: Registered routes:")
    for rule in app.url_map.iter_rules():
        print(f"  {rule.rule} -> {rule.endpoint} [{', '.join(rule.methods)}]")
    app.run(host='0.0.0.0', port=PORT, debug=False)
