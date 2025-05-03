from flask import Flask, jsonify, request
from flask_mongoengine import MongoEngine
import mongoengine as me
from flask_cors import CORS

from amr_module import execute_task, get_task_status, stop_task, cancel_task
# Initialize Flask app
app = Flask(__name__)

# Configure MongoDB
app.config['MONGODB_SETTINGS'] = {
    'host': 'mongodb',
    'port': 27017,
    'db': 'amr-db',
    'username': 'root',
    'password': 'root',
}

# Initialize extensions
db = MongoEngine(app)
CORS(app=app, resources={r"/*": {"origins": "*"}})

# Define MongoDB models
class Task(db.Document):
    name = me.StringField(required=True)
    description = me.StringField()
    actions = me.ListField(me.DictField())
    
    meta = {'collection': 'tasks'}
    
    def to_json(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'actions': self.actions
        }

class TaskInstance(db.Document):
    task_id = me.StringField(required=True)
    status = me.StringField(required=True, default='Queued')
    current_action_index = me.IntField(default=0)
    updated_at = me.DateTimeField()
    created_at = me.DateTimeField()
    actions = me.ListField(me.DictField())
    
    meta = {'collection': 'task_instances'}
    
    def to_json(self):
        return {
            'id': str(self.id),
            'task': Task.objects.get(id=self.task_id).to_json(),
            'status': self.status,
            'current_action_index': self.current_action_index,
            'updated_at': self.updated_at,
        }

# Sample routes
@app.route('/')
def index():
    return jsonify({"message": "API is working"})

# API to create a new Task
@app.route('/tasks', methods=['POST'])
def create_task():
    try:
        data = request.get_json()
        new_task = Task(
            name=data['name'],
            description=data.get('description', ''),
            actions=data.get('actions', [])
        )
        new_task.save()
        return jsonify({"success": True, "task": new_task.to_json()}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# API to create a new TaskInstance
@app.route('/execute-sequence', methods=['POST'])
def create_task_instance():
    try:
        data = request.get_json()
        task = Task.objects.get(id=data['task_id'])
        new_instance = TaskInstance(
            task_id=str(task.id),
            status=data.get('status'),
            actions=task.actions
        )
        new_instance.save()
        success = execute_task(new_instance.id)  # Call the function to execute the task
        return jsonify({"success": success, "task_instance": new_instance.to_json()}), 201
    except Task.DoesNotExist:
        return jsonify({"success": False, "error": "Task not found"}), 404
    except Exception as e:
        print(e)
        return jsonify({"success": False, "error": str(e)}), 400

# API to get all Tasks
@app.route('/tasks', methods=['GET'])
def get_tasks():
    tasks = Task.objects.all()
    return jsonify({"success": True, "tasks": [task.to_json() for task in tasks]}), 200

@app.route('/tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    task = Task.objects.get(id=task_id)
    task.delete()
    return jsonify({"success": True}), 200

# API to update TaskInstance status
@app.route('/task-instances/<instance_id>', methods=['PUT'])
def update_task_instance(instance_id):
    try:
        data = request.get_json()
        
        if 'status' not in data:
            return jsonify({"success": False, "error": "Status field is required"}), 400
            
        instance = TaskInstance.objects.get(id=instance_id)
        instance.status = data['status']
        instance.save()
        
        return jsonify({"success": True, "task_instance": instance.to_json()}), 200
    except TaskInstance.DoesNotExist:
        return jsonify({"success": False, "error": "Task instance not found"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# API to get all TaskInstances (excluding completed and cancelled)
@app.route('/task-instances', methods=['GET'])
def get_task_instances():
    instances = TaskInstance.objects(status__nin=['Completed'])
    return jsonify({"success": True, "task_instances": [instance.to_json() for instance in instances]}), 200

# API to get detailed task status
@app.route('/get-task-status/<instance_id>', methods=['GET'])
def get_detailed_task_status(instance_id):
    try:
        result = get_task_status(instance_id)
        if "error" in result:
            return jsonify({"success": False, "error": result["error"]}), 400
        return jsonify({"success": True, "status_details": result}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# API to stop a task immediately
@app.route('/stop-task/<instance_id>', methods=['POST'])
def stop_task_immediately(instance_id):
    try:
        result = stop_task(instance_id)
        if "error" in result:
            return jsonify({"success": False, "error": result["error"]}), 400
        return jsonify({"success": True, "result": result}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# API to cancel a task after current action completes
@app.route('/cancel-task/<instance_id>', methods=['GET'])
def cancel_task_gracefully(instance_id):
    try:
        result = cancel_task(instance_id)
        if "error" in result:
            return jsonify({"success": False, "error": result["error"]}), 400
        return jsonify({"success": True, "result": result}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# For backward compatibility - simplified status
@app.route('/get-status/<instance_id>', methods=['GET'])
def get_task_status_simple(instance_id):
    try:
        instance = TaskInstance.objects.get(id=instance_id)
        return jsonify({"success": True, "status": instance.status}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

if __name__ == '__main__':
    # Clear all collections on startup
    Task.objects.delete()
    TaskInstance.objects.delete()
    print("Cleared all collections from the database.")
    app.run(debug=True,use_reloader=False,port=5000,host='0.0.0.0')
