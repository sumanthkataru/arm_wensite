"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import TaskProgressBar from "@/components/progress-bar"
import {
  fetchTasks,
  fetchTaskInstances,
  createTaskInstance,
  startTaskInstance,
  pauseTaskInstance,
  cancelTaskInstance,
  refreshTaskStatus,
  deleteTask,
} from "@/lib/api"
import { Eye } from "lucide-react"

export default function Dashboard() {
  const [tasks, setTasks] = useState([])
  const [assignedTasks, setAssignedTasks] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionInProgress, setActionInProgress] = useState(null)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [selectedInstance, setSelectedInstance] = useState(null)

  useEffect(() => {
    async function updateTaskInstances() {
      try {
        const instancesData = await fetchTaskInstances();
        setAssignedTasks(instancesData);
      } catch (err) {
        console.error(`Failed to update task instances: ${err.message}`);
      }
    }
  
    // Set an interval to fetch task instances every 5 seconds
    const intervalId = setInterval(updateTaskInstances, 5000);
  
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Load tasks from API on component mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setError(null)

      try {
        const [tasksData, instancesData] = await Promise.all([fetchTasks(), fetchTaskInstances()])

        setTasks(tasksData)
        setAssignedTasks(instancesData)
      } catch (err) {
        setError(`Failed to load data: ${err.message}`)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleAssignTask = async () => {
    if (!selectedTask) return

    setActionInProgress("assigning")

    try {
      // Create a task instance with a unique ID and status
      const instanceData = {
        task_id: selectedTask.id,
      }

      // Call API to create task instance
      const newInstance = await createTaskInstance(instanceData)

      // Add to assigned tasks
      setAssignedTasks([...assignedTasks, newInstance])

      // Reset selection
      setSelectedTask(null)
    } catch (err) {
      setError(`Failed to assign task: ${err.message}`)
    } finally {
      setActionInProgress(null)
    }
  }

  const handleStartTask = async (instanceId) => {
    console.log("Start Task Called")
    setActionInProgress(`start-${instanceId}`)
    try {
      await startTaskInstance(instanceId)
      // In a real app, we would update the task status based on the API response
      setAssignedTasks(
        assignedTasks.map((task) => (task.id === instanceId ? { ...task, status: "In Progress" } : task)),
      )
    } catch (err) {
      setError(`Failed to start task: ${err.message}`)
    } finally {
      setActionInProgress(null)
    }
  }

  const handlePauseTask = async (instanceId) => {
    console.log("Pause Task Called")
    setActionInProgress(`pause-${instanceId}`)
    try {
      await pauseTaskInstance(instanceId)
      // In a real app, we would update the task status based on the API response
      setAssignedTasks(assignedTasks.map((task) => (task.id === instanceId ? { ...task, status: "Paused" } : task)))
    } catch (err) {
      setError(`Failed to pause task: ${err.message}`)
    } finally {
      setActionInProgress(null)
    }
  }

  const handleCancelTask = async (instanceId) => {
    setActionInProgress(`cancel-${instanceId}`)
    try {
      await cancelTaskInstance(instanceId)
      // In a real app, we would update the task status based on the API response
      setAssignedTasks(assignedTasks.map((task) => (task.id === instanceId ? { ...task, status: "Cancelled" } : task)))
    } catch (err) {
      setError(`Failed to cancel task: ${err.message}`)
    } finally {
      setActionInProgress(null)
    }
  }

  const handleRefreshStatus = async (instanceId) => {
    setActionInProgress(`refresh-${instanceId}`)
    try {
      const result = await refreshTaskStatus(instanceId)
      // Update the task status based on the API response
      setAssignedTasks(
        assignedTasks.map((task) => (task.id === instanceId ? { ...task, status: result.status } : task)),
      )
    } catch (err) {
      setError(`Failed to refresh status: ${err.message}`)
    } finally {
      setActionInProgress(null)
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      return
    }

    setActionInProgress(`delete-${taskId}`)
    try {
      await deleteTask(taskId)
      // Remove the task from the tasks list
      setTasks(tasks.filter((task) => task.id !== taskId))
      // If the deleted task was selected, clear the selection
      if (selectedTask?.id === taskId) {
        setSelectedTask(null)
      }
    } catch (err) {
      setError(`Failed to delete task: ${err.message}`)
    } finally {
      setActionInProgress(null)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "Queued":
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Queued</span>
      case "In Progress":
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">In Progress</span>
      case "Completed":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Completed</span>
      case "Failed":
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Failed</span>
      case "Paused":
        return <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">Paused</span>
      case "Cancelled":
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Cancelled</span>
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>
    }
  }

  // Loading spinner component
  const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  )

  const openProgressModal = (instance) => {
    setSelectedInstance(instance)
    setShowProgressModal(true)
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-gray-900 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Link
            href="/create-task"
            className="bg-gray-800 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-700 border border-gray-700 transition-colors"
          >
            Create New Task
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 bg-gray-900 min-h-screen">
        {error && (
          <div className="mb-4 p-3 bg-red-900 text-white rounded-md border border-red-700">
            {error}
            <button className="ml-2 underline" onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <LoadingSpinner />
              <p className="mt-2 text-white">Loading data...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              {/* Available Tasks */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-sm p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4 text-white">Available Tasks</h2>

                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>No tasks available</p>
                    <Link href="/create-task" className="mt-2 inline-block text-blue-400 hover:underline">
                      Create your first task
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-3 border border-gray-700 rounded-md transition-colors ${
                          selectedTask?.id === task.id ? "bg-blue-900 border-blue-700" : "hover:bg-gray-700"
                        }`}
                      >
                        <div
                          className="cursor-pointer"
                          onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                        >
                          <div className="font-medium text-white">{task.name}</div>
                          <div className="text-sm text-gray-400 mt-1">{task.actions?.length || 0} actions</div>
                          {task.description && (
                            <div className="text-sm text-gray-400 mt-1 line-clamp-2">{task.description}</div>
                          )}
                        </div>
                        <div className="mt-2 flex justify-end">
                          <button
                            className={`p-1 bg-red-800 text-red-100 rounded hover:bg-red-700 ${
                              actionInProgress === `delete-${task.id}` ? "opacity-50" : ""
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            disabled={actionInProgress === `delete-${task.id}`}
                            title="Delete Task"
                          >
                            {actionInProgress === `delete-${task.id}` ? (
                              <LoadingSpinner />
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 ${selectedTask && !actionInProgress
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-700 text-gray-400 cursor-not-allowed"
                    }`}
                  onClick={handleAssignTask}
                  disabled={!selectedTask || actionInProgress === "assigning"}
                >
                  {actionInProgress === "assigning" ? (
                    <>
                      <LoadingSpinner />
                      Assigning...
                    </>
                  ) : (
                    "Assign to AMR"
                  )}
                </button>
              </div>
            </div>

            {/* Assigned Tasks */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-sm p-4">
              <h2 className="text-xl font-bold mb-4 text-white">Assigned Tasks</h2>

              {assignedTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No tasks currently assigned</p>
                  <p className="text-sm mt-1">Select a task from the available tasks and click "Assign to AMR"</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700 text-gray-300">
                        <th className="text-left py-2 px-2">ID</th>
                        <th className="text-left py-2 px-2">Task</th>
                        <th className="text-left py-2 px-2">Status</th>
                        <th className="text-left py-2 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedTasks.map((instance) => (
                        <tr key={instance.id} className="border-b border-gray-700 hover:bg-gray-700 text-white">
                          <td className="py-2 px-2 font-mono text-xs">{instance.id}</td>
                          <td className="py-2 px-2">{instance.taskName || instance.task?.name || "Unknown"}</td>
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(instance.status)}
                              <button
                                onClick={() => openProgressModal(instance)}
                                className="ml-1 bg-gray-600 hover:bg-gray-500 p-1 rounded text-xs"
                                title="View Task Progress"
                              >
                                <Eye className="h-4 w-4 text-gray-200" />
                              </button>
                            </div>
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex gap-1">
                              {instance.status === "Cancelled" || instance.status === "Completed" || instance.status === "Queued" ? (
                                <>-</>
                              ) : (
                                <>
                                  <button
                                    className={`p-1 rounded ${
                                      instance.status === "In Progress"
                                        ? "bg-yellow-800 text-yellow-100 hover:bg-yellow-700"
                                        : "bg-green-800 text-green-100 hover:bg-green-700"
                                    } ${actionInProgress === `start-${instance.id}` || actionInProgress === `pause-${instance.id}` ? "opacity-50" : ""}`}
                                    onClick={() => {
                                      if (instance.status === "In Progress") {
                                        handlePauseTask(instance.id);
                                      } else {
                                        handleStartTask(instance.id);
                                      }
                                    }}
                                    disabled={
                                      actionInProgress === `start-${instance.id}` ||
                                      actionInProgress === `pause-${instance.id}`
                                    }
                                    title={instance.status === "In Progress" ? "Pause Task" : "Start Task"}
                                  >
                                    {actionInProgress === `start-${instance.id}` || actionInProgress === `pause-${instance.id}` ? (
                                      <LoadingSpinner />
                                    ) : instance.status === "In Progress" ? (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                    ) : (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                        />
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                    )}
                                  </button>

                                  <button
                                    className={`p-1 bg-red-800 text-red-100 rounded hover:bg-red-700 ${
                                      actionInProgress === `cancel-${instance.id}` ? "opacity-50" : ""
                                    }`}
                                    onClick={() => handleCancelTask(instance.id)}
                                    disabled={actionInProgress === `cancel-${instance.id}`}
                                    title="Cancel Task"
                                  >
                                    {actionInProgress === `cancel-${instance.id}` ? (
                                      <LoadingSpinner />
                                    ) : (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                    )}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Task Progress Modal */}
        {showProgressModal && selectedInstance && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">
                  Task Progress: {selectedInstance.taskName || selectedInstance.task?.name || "Unknown"}
                </h3>
                <button
                  onClick={() => setShowProgressModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">Status: {getStatusBadge(selectedInstance.status)}</span>
                  <span className="text-gray-300">ID: <span className="font-mono">{selectedInstance.id}</span></span>
                </div>
                
                {selectedInstance.task?.actions ? (
                  <TaskProgressBar 
                    task={selectedInstance.task} 
                    currentActionIndex={selectedInstance.current_action_index || 0}
                    status={selectedInstance.status}
                  />
                ) : (
                  <div className="text-gray-400 text-center py-8">
                    No task details available
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowProgressModal(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
