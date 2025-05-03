"use client"

import { act, useState } from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ActionLibrary } from "@/components/action-library"
import { WorkflowCanvas } from "@/components/workflow-canvas"
import { ConfigPanel } from "@/components/config-panel"
import { createTask } from "@/lib/api"

// Action types
const ACTION_TYPES = {
  MOVE: "MOVE",
  LATCH: "LATCH",
  UNLATCH: "UNLATCH",
  REVERSE: "REVERSE",
  WAIT_FOR_TRIGGER: "WAIT FOR TRIGGER",
  WAIT_FOR_TIME: "WAIT",
  RELEASE_TRIGGER: "RELEASE TRIGGER",
  HORN: "HORN",
  ANNOUNCE: "ANNOUNCE",
  ROTATE: "ROTATE",
}

export default function TaskCreator() {
  const router = useRouter()
  const [workflow, setWorkflow] = useState([])
  const [selectedActionIndex, setSelectedActionIndex] = useState(null)
  const [taskName, setTaskName] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const handleAddAction = (actionType) => {
    const newAction = {
      id: `action-${Date.now()}`,
      type: actionType,
      config: {},
    }
    setWorkflow([...workflow, newAction])
    setSelectedActionIndex(workflow.length)
  }

  const moveItem = (dragIndex, hoverIndex) => {
    const draggedItem = workflow[dragIndex]
    const newWorkflow = [...workflow]
    newWorkflow.splice(dragIndex, 1)
    newWorkflow.splice(hoverIndex, 0, draggedItem)
    setWorkflow(newWorkflow)
    setSelectedActionIndex(hoverIndex)
  }

  const handleRemoveAction = (index) => {
    const newWorkflow = [...workflow]
    newWorkflow.splice(index, 1)
    setWorkflow(newWorkflow)
    setSelectedActionIndex(null)
  }

  const handleUpdateAction = (index, config) => {
    const newWorkflow = [...workflow]
    newWorkflow[index] = {
      ...newWorkflow[index],
      config,
    }
    setWorkflow(newWorkflow)
  }

  const handleOpenModal = () => {
    if (!isWorkflowValid) return
    setShowModal(true)
  }

  const handleSaveTask = async () => {
    if (!isWorkflowValid) return

    setIsSaving(true)
    setError(null)

    try {
      // Prepare task data for API
      const taskData = {
        name: taskName,
        description: taskDescription,
        actions: workflow,
      }

      // Call API to create task
      await createTask(taskData)

      // Redirect to dashboard instead of showing alert
      router.push("/")
    } catch (err) {
      setError(`Failed to save task: ${err.message}`)
      setIsSaving(false)
    }
  }

  const isWorkflowValid =
    workflow.length > 0 &&
    workflow.every((action) => {
      if (action.type === ACTION_TYPES.MOVE) {
        return !!action.config?.location;
      }
      if (action.type === ACTION_TYPES.WAIT_FOR_TRIGGER) {
        return !!action.config?.trigger_id;
      }
      // if (action.type === ACTION_TYPES.WAIT_FOR_TIME) {
      //   return action.config?.wait_time > 0;
      // }
      if (action.type === ACTION_TYPES.RELEASE_TRIGGER) {
        return !!action.config?.wait_id && action.config?.state !== undefined;
      }
      if (action.type === ACTION_TYPES.ANNOUNCE) {
        return !!action.config?.announcement 
        // && 
              //  action.config?.repetitions > 0 && 
              //  action.config?.repetitions <= 5;
      }
      if (action.type === ACTION_TYPES.HORN) {
        return !!action.config?.horn 
        // && 
              //  action.config?.repetitions > 0 && 
              //  action.config?.repetitions <= 10;
      }
      // if (action.type === ACTION_TYPES.ROTATE) {
      //   return action.config?.steering_angle !== undefined && 
      //          action.config?.target_diff !== undefined;
      // }
      if (action.type === ACTION_TYPES.REVERSE) {
        return !!action.config?.presetName && !!action.config?.name && !!action.config?.state && !!action.config?.hitch;
      }
      // LATCH and UNLATCH don't need additional configuration based on the code
      return true;
    });
    
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-screen">
        <header className="bg-gray-900 text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold">
              Task Creator
            </Link>
            <button
              className={`px-4 py-2 text-md font-bold rounded-md flex items-center gap-2 ${
                isWorkflowValid && !isSaving
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
              onClick={handleOpenModal}
              disabled={!isWorkflowValid || isSaving}
            >
              {isSaving ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Task
                </>
              )}
            </button>
          </div>
        </header>

        <main className="flex flex-1 overflow-hidden">
          <ActionLibrary onAddAction={handleAddAction} actionTypes={ACTION_TYPES} />

          <WorkflowCanvas
            workflow={workflow}
            selectedActionIndex={selectedActionIndex}
            onSelectAction={setSelectedActionIndex}
            onRemoveAction={handleRemoveAction}
            moveItem={moveItem}
            actionTypes={ACTION_TYPES}
          />

          <ConfigPanel
            selectedAction={selectedActionIndex !== null ? workflow[selectedActionIndex] : null}
            onUpdateAction={
              selectedActionIndex !== null ? (config) => handleUpdateAction(selectedActionIndex, config) : undefined
            }
            actionTypes={ACTION_TYPES}
          />
        </main>

        {/* Task Details Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
              <h2 className="text-xl font-bold text-white mb-4">Task Details</h2>
              
              {error && <div className="mb-4 p-3 bg-red-900 text-white rounded-md border border-red-700">{error}</div>}

              <div className="space-y-4 mb-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="taskName" className="font-medium text-white">
                    Task Name:
                  </label>
                  <input
                    id="taskName"
                    type="text"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className="border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter task name"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="taskDescription" className="font-medium text-white">
                    Description:
                  </label>
                  <textarea
                    id="taskDescription"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    className="border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                    placeholder="Enter task description"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  className={`px-4 py-2 rounded-md ${
                    taskName.trim() !== "" && taskDescription.trim() !== ""
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-700 text-gray-400 cursor-not-allowed"
                  }`}
                  onClick={handleSaveTask}
                  disabled={taskName.trim() === "" || taskDescription.trim() === "" || isSaving}
                >
                  {isSaving ? "Saving..." : "Save Task"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  )
}
