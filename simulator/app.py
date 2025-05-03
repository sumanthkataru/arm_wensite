# app.py
from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
import json
import time
import random
import threading
from datetime import datetime
import logging
from apscheduler.schedulers.background import BackgroundScheduler

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Connect to MongoDB
client = MongoClient('mongodb://root:root@mongodb:27017/')
db = client['amr-db']
amrs_collection = db['amrs']
tasks_collection = db['tasks']
task_instances_collection = db['task_instances']

# Initialize AMRs if they don't exist
def initialize_amrs():
    if amrs_collection.count_documents({}) < 2:
        amrs_collection.delete_many({})  # Clear existing AMRs for clean initialization
        amrs_collection.insert_many([
            {'name': 'AMR-001', 'status': 'IDLE', 'task_instance_id': None},
            {'name': 'AMR-002', 'status': 'IDLE', 'task_instance_id': None}
        ])
        logger.info("AMRs initialized in database")

initialize_amrs()

@app.route('/execute_sequence', methods=['POST'])
def execute_sequence():
    data = request.json
    if not data or 'task_id' not in data:
        return jsonify({'error': 'Missing task_id'}), 400
    
    task_id = data['task_id']
    
    # Get task details
    task = tasks_collection.find_one({'_id': ObjectId(task_id)})
    if not task:
        return jsonify({'error': f'Task with ID {task_id} not found'}), 404
    
    logger.info(f"Task {task_id} queued with instance ID {data['task_instance_id']}")
    return jsonify({
        'task_instance_id': str(data['task_instance_id']),
        'status': 'Queued'
    })

@app.route('/get_task_status', methods=['POST'])
def get_task_status():
    data = request.json
    if not data or 'task_instance_id' not in data:
        return jsonify({'error': 'Missing task_instance_id'}), 400
    
    task_instance_id = data['task_instance_id']
    
    # Get task instance
    task_instance = task_instances_collection.find_one({'_id': ObjectId(task_instance_id)})
    if not task_instance:
        return jsonify({'error': f'Task instance with ID {task_instance_id} not found'}), 404
    
    # Find associated AMR if any
    amr = amrs_collection.find_one({'task_instance_id': task_instance_id})
    
    response = {
        'status': task_instance['status'],
        'current_action_index': task_instance.get('current_action_index', 0),
        'total_actions': len(task_instance.get('actions', [])),
        'created_at': task_instance.get('created_at').isoformat() if 'created_at' in task_instance else None,
        'updated_at': task_instance.get('updated_at').isoformat() if 'updated_at' in task_instance else None
    }
    
    if amr:
        response['amr_name'] = amr['name']
    
    return jsonify(response)

@app.route('/stop_task', methods=['POST'])
def stop_task():
    data = request.json
    if not data or 'task_instance_id' not in data:
        return jsonify({'error': 'Missing task_instance_id'}), 400
    
    task_instance_id = data['task_instance_id']
    
    # Update task instance status to PAUSED
    result = task_instances_collection.update_one(
        {'_id': ObjectId(task_instance_id)},
        {'$set': {'status': 'Paused', 'updated_at': datetime.now()}}
    )
    
    if result.modified_count == 0:
        return jsonify({'error': f'Task instance with ID {task_instance_id} not found or already paused'}), 404
    
    logger.info(f"Task instance {task_instance_id} paused")
    return jsonify({'status': 'Paused'})

@app.route('/resume_task', methods=['POST'])
def resume_task():
    data = request.json
    if not data or 'task_instance_id' not in data:
        return jsonify({'error': 'Missing task_instance_id'}), 400
    
    task_instance_id = data['task_instance_id']
    
    # Update task instance status to IN_PROGRESS
    result = task_instances_collection.update_one(
        {'_id': ObjectId(task_instance_id)},
        {'$set': {'status': 'In Progress', 'updated_at': datetime.now()}}
    )
    
    if result.modified_count == 0:
        return jsonify({'error': f'Task instance with ID {task_instance_id} not found or already in progress'}), 404
    
    logger.info(f"Task instance {task_instance_id} resumed")
    return jsonify({'status': 'In Progress'})

@app.route('/cancel_task', methods=['POST']) 
def cancel_task():
    data = request.json
    if not data or 'task_instance_id' not in data:
        return jsonify({'error': 'Missing task_instance_id'}), 400
    
    task_instance_id = data['task_instance_id']
    
    # Get task instance
    task_instance = task_instances_collection.find_one({'_id': ObjectId(task_instance_id)})
    if not task_instance:
        return jsonify({'error': f'Task instance with ID {task_instance_id} not found'}), 404
    
    # Free the AMR
    amrs_collection.update_one(
        {'task_instance_id': task_instance_id},
        {'$set': {'status': 'IDLE', 'task_instance_id': None}}
    )
    
    # Update task instance status to CANCELLED
    task_instances_collection.update_one(
        {'_id': ObjectId(task_instance_id)},
        {'$set': {'status': 'Cancelled', 'updated_at': datetime.now()}}
    )
    
    logger.info(f"Task instance {task_instance_id} cancelled and AMR freed")
    return jsonify({'status': 'Cancelled'})

def process_tasks():
    logger.info("Processing tasks...")
    
    # Loop through all AMRs
    for amr in amrs_collection.find():
        if amr['status'] == 'IDLE':
            # Find the first queued task instance
            queued_task = task_instances_collection.find_one({'status': 'Queued'})
            if queued_task:
                # Assign task to AMR
                amrs_collection.update_one(
                    {'_id': amr['_id']},
                    {'$set': {
                        'status': 'BUSY',
                        'task_instance_id': str(queued_task['_id'])
                    }}
                )
                
                # Update task instance status
                task_instances_collection.update_one(
                    {'_id': queued_task['_id']},
                    {'$set': {
                        'status': 'In Progress',
                        'current_action_index': 0,
                        'updated_at': datetime.now()
                    }}
                )
                
                logger.info(f"Assigned task {queued_task['_id']} to AMR {amr['name']}")
        else:
            # AMR is busy, get its assigned task
            task_instance_id = amr.get('task_instance_id')
            if not task_instance_id:
                continue
                
            task_instance = task_instances_collection.find_one({'_id': ObjectId(task_instance_id)})
            if not task_instance:
                # Invalid task instance, free the AMR
                amrs_collection.update_one(
                    {'_id': amr['_id']},
                    {'$set': {'status': 'IDLE', 'task_instance_id': None}}
                )
                continue
                
            # Skip if task is paused
            if task_instance['status'] == 'Paused':
                continue
                
            # Increment current action index
            current_index = task_instance.get('current_action_index', 0)
            actions = task_instance.get('actions', [])
            
            if current_index >= len(actions) - 1:
                # Task completed
                task_instances_collection.update_one(
                    {'_id': ObjectId(task_instance_id)},
                    {'$set': {
                        'status': 'Completed',
                        'updated_at': datetime.now()
                    }}
                )
                
                # Free the AMR
                amrs_collection.update_one(
                    {'_id': amr['_id']},
                    {'$set': {'status': 'IDLE', 'task_instance_id': None}}
                )
                
                logger.info(f"Task {task_instance_id} completed by AMR {amr['name']}")
            else:
                # Move to next action
                task_instances_collection.update_one(
                    {'_id': ObjectId(task_instance_id)},
                    {'$set': {
                        'current_action_index': current_index + 1,
                        'updated_at': datetime.now()
                    }}
                )
                
                logger.info(f"AMR {amr['name']} moved to action {current_index + 1} for task {task_instance_id}")

# Initialize scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(process_tasks, 'interval', minutes=1)
scheduler.start()

if __name__ == '__main__':
    # clear existing AMRs for clean initialization
    amrs_collection.delete_many({})
    try:
        app.run(host='0.0.0.0', port=5050, debug=True, use_reloader=False)
    finally:
        scheduler.shutdown()