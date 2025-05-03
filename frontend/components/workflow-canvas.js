"use client"

import { useDrop } from "react-dnd"
import { DraggableActionItem } from "./draggable-action-item"

export function WorkflowCanvas({
  workflow,
  selectedActionIndex,
  onSelectAction,
  onRemoveAction,
  moveItem,
  actionTypes,
}) {
  const [, drop] = useDrop({
    accept: "WORKFLOW_ITEM",
    hover: () => {},
  })

  return (
    <div className="w-2/4 bg-gray-900 p-3 overflow-y-auto flex flex-col">
      <h2 className="text-xl font-bold mb-3 text-white">Workflow Canvas</h2>

      {workflow.length === 0 ? (
        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-700 rounded-lg p-8">
          <div className="text-center text-gray-400">
            <p className="mb-2 text-lg">Your workflow is empty</p>
            <p>Click on an action from the library to add it to your workflow</p>
          </div>
        </div>
      ) : (
        <div ref={drop} className="relative">
          <div className="space-y-4">
            {workflow.map((action, index) => (
              <DraggableActionItem
                key={action.id}
                index={index}
                action={action}
                isSelected={selectedActionIndex === index}
                onSelect={() => onSelectAction(index)}
                onRemove={() => onRemoveAction(index)}
                moveItem={moveItem}
                actionTypes={actionTypes}
                totalItems={workflow.length}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
