// API service functions to interact with the backend

import axios from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
  })


export async function fetchTasks() {
    try {
      const response = await api.get("/tasks")
      console.log("Response:", response)
      const data = await response.data
      return data.tasks
    } catch (error) {
      console.error("Error fetching tasks:", error)
      throw error
    }
  }
  
  export async function createTask(taskData) {
    try {
      const response = await api.post("/tasks", taskData)
      const data = await response.data
      return data.task
    } catch (error) {
      console.error("Error creating task:", error)
      throw error
    }
  }
  
  export async function fetchTaskInstances() {
    try {
      const response = await api.get("/task-instances")
      const data = await response.data
      return data.task_instances
    } catch (error) {
      console.error("Error fetching task instances:", error)
      throw error
    }
  }
  
  export async function createTaskInstance(instanceData) {
    try {
      const response = await api.post("/execute-sequence", instanceData)
      const data = await response.data
      return data.task_instance
    } catch (error) {
      console.error("Error creating task instance:", error)
      throw error
    }
  }
  
  // Placeholder functions for task instance actions
  export async function startTaskInstance(instanceId) {
    try{
      const response = await api.put(`/task-instances/${instanceId}`,
        {
          status: "In Progress",
        },{
          headers: {
            "Content-Type": "application/json",
          }
      })
      const data = await response.data
      return data.task_instance
    } catch (error) {
      console.error("Error starting task instance:", error)
      throw error
    }
  }
  
  export async function pauseTaskInstance(instanceId) {
    try{
      const response = await api.put(`/task-instances/${instanceId}`,
        {
          status: "Paused",
        },{
          headers: {
            "Content-Type": "application/json",
          }
      })
      const data = await response.data
      return data.task_instance
    } catch (error) {
      console.error("Error starting task instance:", error)
      throw error
    }
  }
  
  export async function cancelTaskInstance(instanceId) {
    try {
      const response = await api.get(`/cancel-task/${instanceId}`)
      const data = await response.data
      return data
    } catch (error) {
      console.error("Error Cancelling:", error)
      throw error
    }
  }
  
  export async function refreshTaskStatus(instanceId) {
    try {
      const response = await api.get(`/get-status/${instanceId}`)
      const data = await response.data
      return data.status
    } catch (error) {
      console.error("Error refreshing:", error)
      throw error
    }
  }
  
  export async function deleteTask(taskId) {
    try {
      const response = await api.delete(`/tasks/${taskId}`)
    } catch (error) {
      console.error("Error creating task instance:", error)
      throw error
    }
  }
