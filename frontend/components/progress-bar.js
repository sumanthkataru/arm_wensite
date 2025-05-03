import { useState } from "react";
import { Stepper, Step } from "@material-tailwind/react";
 
export default function TaskProgressBar({ task, currentActionIndex = 0, status = "Queued" }) {
  const [expanded, setExpanded] = useState(false);
 
  if (!task || !task.actions || task.actions.length === 0) {
    return <div className="text-gray-400 text-sm">No actions available</div>;
  }
 
  // Progress calculations
  const totalActions = task.actions.length;
  const isAbandoned = ["Cancelled", "Failed"].includes(status);
  const isCompleted = status === "Completed"; // This indicates the task is completed
 
  const completedActions = isCompleted
    ? totalActions
    : Math.min(currentActionIndex, totalActions);
 
  const activeStep = isCompleted
    ? totalActions - 1
    : Math.min(currentActionIndex, totalActions - 1);
 
  const progressPercentage = Math.round((completedActions / totalActions) * 100);
 
  return (
    <div className="mt-2">
      {/* Progress summary */}
      <div className="mb-3 bg-gray-900 p-3 rounded-md">
        <div className="flex justify-between mb-1">
          <span className="text-gray-300">Progress: {progressPercentage}%</span>
          <span className="text-gray-300">
            {completedActions} of {totalActions} actions{" "}
            {isCompleted
              ? "completed"
              : isAbandoned
              ? "attempted"
              : "completed"}
          </span>
        </div>
        {isAbandoned && completedActions < totalActions && (
          <div className="text-yellow-500 text-sm mt-1">
            {totalActions - completedActions} actions were not executed due to{" "}
            {status.toLowerCase()} task.
          </div>
        )}
      </div>
 
      {/* Action Details */}
      <div className="mt-10">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-400 hover:underline"
        >
          {expanded ? "Hide action details" : "Show action details"}
        </button>
 
        {expanded && (
          <div className="mt-2 text-sm bg-gray-900 p-3 rounded-md max-h-60 overflow-y-auto">
            <ul className="space-y-2">
              {task.actions.map((action, index) => {
                const isActionCompleted = isCompleted || index < currentActionIndex;
                const isCurrent = index === currentActionIndex;
                const isPending = index > currentActionIndex;
 
                let statusColor = "text-gray-500";
                let statusText = "Pending";
 
                if (isActionCompleted) {
                  statusColor = "text-green-500";
                  statusText = "Completed";
                } else if (isCurrent) {
                  statusColor = status !== "Queued" ? "text-yellow-500" : "text-gray-500";
                  statusText = status !== "Queued" ? status : "Pending";
                } else if (isAbandoned) {
                  statusColor = "text-red-500";
                  statusText = "Abandoned";
                }
 
                return (
                  <li key={index} className={`flex p-2 rounded ${isCurrent ? "bg-gray-800" : ""}`}>
                    <span className="mr-2 font-mono text-gray-400">{index + 1}.</span>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-white font-medium">{action.type || "Action"}</span>
                        <span className={statusColor}>{statusText}</span>
                      </div>
 
                      {action.config && Object.keys(action.config).length > 0 ? (
                        <div className="mt-1 text-xs text-gray-400">
                          <div className="font-mono bg-gray-800 p-1 rounded">
                            {Object.entries(action.config).map(([key, value]) => (
                              <div key={key}>
                                <span className="text-gray-500">{key}:</span>{" "}
                                {typeof value === "object"
                                  ? `${Object.keys(value).length} properties`
                                  : String(value).substring(0, 50) + (String(value).length > 50 ? "..." : "")}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 mt-1">No configuration</div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
