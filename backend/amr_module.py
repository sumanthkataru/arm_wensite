from flask import jsonify
import requests
import json
from datetime import datetime
from bson.objectid import ObjectId


def execute_task(task_instance_id):
    """
    Execute a task with the given task instance ID.
    This function retrieves the task instance from MongoDB,
    formats the data according to the required API structure,
    and makes a request to execute the sequence.
    """
    try:
        # Import here to avoid circular imports
        from app import TaskInstance, Task
        
        # Get the task instance from MongoDB
        instance = TaskInstance.objects.get(id=task_instance_id)
        task = Task.objects.get(id=instance.task_id)
        
        # Build the sequence based on task actions
        sequence = []
        for action in task.actions:
            action_type = action.get('type')
            config = action.get('config', {})
            
            if action_type == "MOVE":
                sequence.append(["Move to indexed location", config.get("location")])
            elif action_type == "LATCH":
                sequence.append(["Latch", {}])
            elif action_type == "UNLATCH":
                sequence.append(["Unlatch", {}])
            elif action_type == "REVERSE":
                # Extract all necessary parameters from config
                sequence.append([
                    "Reverse", 
                    config.get("state"), 
                    config.get("name"),
                    float(config.get("y_threshold", 0.02)),
                    float(config.get("x_threshold", 0)),
                    float(config.get("ka_1", -50)),
                    float(config.get("ka_2", -50)),
                    float(config.get("kc", 0)),
                    float(config.get("speed", 10)),
                    float(config.get("angle_factor", 1.5)),
                    float(config.get("zone", 99)),
                    float(config.get("vehicle_latch_distance", -0.7)),
                    float(config.get("latch_project_dist", 0.7)),
                    config.get("hitch", "True").lower() == "true"
                ])
            elif action_type == "WAIT FOR TRIGGER":
                sequence.append(["Wait for specified trigger", config.get("trigger_id")])
            elif action_type == "WAIT":
                sequence.append(["Wait for specified time", float(config.get("wait_time", 0))])
            elif action_type == "RELEASE TRIGGER":
                sequence.append(["Release trigger", config.get("wait_id"), config.get("state", False)])
            elif action_type == "HORN":
                sequence.append(["Horn", config.get("horn"), int(config.get("repetitions", 1))])
            elif action_type == "ANNOUNCE":
                sequence.append(["Voice announcement", config.get("announcement"), int(config.get("repetitions", 1))])
            elif action_type == "ROTATE":
                sequence.append([
                    "Inplace Rotation", 
                    float(config.get("steering_angle", 50)), 
                    float(config.get("target_diff", 180))
                ])
                
        # Prepare the payload
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        payload = {
            "sequence": sequence,
            "time_dependant": "0",
            "time_of_assignment": current_time,
            "task_instance_id": str(task_instance_id),
            "task_id": str(task.id),
            "time_of_creation": current_time,
            "version": "1",
            "serial_number": "1",
            "task_name": task.name
        }
        
        # Make the API request to execute the sequence
        response = requests.post(
            "http://localhost:5050/execute_sequence",
            headers={"Content-Type": "application/json"},
            data=json.dumps(payload)
        )
        
        # Update the task instance status based on the response
        if response.status_code == 200:
            response_data = response.json()
            instance.status = response_data.get("status", "Queued")
            instance.save()
            return True
        else:
            # If the request failed, update the task instance status
            instance.status = "Failed"
            instance.save()
            return False
            
    except Exception as e:
        print(f"Error executing task: {str(e)}")
        return False


def get_task_status(task_instance_id):
    """
    Get the detailed status of a task instance.
    Returns a detailed breakdown of actions and their statuses.
    """
    try:
        # Import here to avoid circular imports
        from app import TaskInstance
        
        # First check if we have the instance in our database
        instance = TaskInstance.objects.get(id=task_instance_id)
        
        # Make API request to get detailed status from execution engine
        response = requests.post(
            "http://localhost:5050/get_task_status",
            headers={"Content-Type": "application/json"},
            data=json.dumps({"task_instance_id": str(task_instance_id)})
        )
        
        if response.status_code == 200:
            response_data = response.json()
            # Update our database with the overall status
            if "sequence_status" in response_data:
                instance.status = response_data["sequence_status"]
                instance.save()
            return response_data
        else:
            return {"error": "Failed to get task status", "status_code": response.status_code}
            
    except Exception as e:
        print(f"Error getting task status: {str(e)}")
        return {"error": str(e)}


def stop_task(task_instance_id):
    """
    Stop a task immediately during execution.
    This will stop the current action in process.
    """
    try:
        # Import here to avoid circular imports
        from app import TaskInstance
        
        # Check if the task instance exists
        instance = TaskInstance.objects.get(id=task_instance_id)
        
        # Make API request to stop the task
        response = requests.post(
            "http://localhost:5050/stop_task",
            headers={"Content-Type": "application/json"},
            data=json.dumps({"task_instance_id": str(task_instance_id)})
        )
        
        if response.status_code == 200:
            response_data = response.json()
            # Update the task instance status
            instance.status = "Stopped"
            instance.save()
            return response_data
        else:
            return {"error": "Failed to stop task", "status_code": response.status_code}
            
    except Exception as e:
        print(f"Error stopping task: {str(e)}")
        return {"error": str(e)}


def cancel_task(task_instance_id):
    """
    Cancel a task during execution after the current action completes.
    """
    try:
        # Import here to avoid circular imports
        from app import TaskInstance
        
        # Check if the task instance exists
        instance = TaskInstance.objects.get(id=task_instance_id)
        
        # Make API request to cancel the task
        response = requests.post(
            "http://localhost:5050/cancel_task",
            headers={"Content-Type": "application/json"},
            data=json.dumps({"task_instance_id": str(task_instance_id)})
        )
        
        if response.status_code == 200:
            response_data = response.json()
            # Update the task instance status
            instance.status = "Cancelled"
            instance.save()
            return response_data
        else:
            return {"error": "Failed to cancel task", "status_code": response.status_code}
            
    except Exception as e:
        print(f"Error cancelling task: {str(e)}")
        return {"error": str(e)}
