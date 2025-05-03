"use client"

import { useRef } from "react"
import { useDrag, useDrop } from "react-dnd"
import { MapPin, Link, Unlink, ArrowLeft, Bell, Clock, Send, Volume2, MessageSquare, RotateCcw } from "lucide-react"

export function DraggableActionItem({ index, action, isSelected, onSelect, onRemove, moveItem, actionTypes, totalItems }) {
  const ref = useRef(null)

  const [{ isDragging }, drag] = useDrag({
    type: "WORKFLOW_ITEM",
    item: () => {
      return { id: action.id, index }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "WORKFLOW_ITEM",
    hover(item, monitor) {
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return
      }

      // Get rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect()
      
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      
      // Get mouse position
      const clientOffset = monitor.getClientOffset()
      
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top
      
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }
      
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      // Move the item
      moveItem(dragIndex, hoverIndex)

      // Update the item's index for future drags
      item.index = hoverIndex
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  })

  // Combine drag and drop refs
  drag(drop(ref))

  const getIcon = (type) => {
    switch (type) {
      case actionTypes.MOVE:
        return <MapPin className="h-4 w-4" />
      case actionTypes.LATCH:
        return <Link className="h-4 w-4" />
      case actionTypes.UNLATCH:
        return <Unlink className="h-4 w-4" />
      case actionTypes.REVERSE:
        return <ArrowLeft className="h-4 w-4" />
      case actionTypes.WAIT_FOR_TRIGGER:
        return <Bell className="h-4 w-4" />
      case actionTypes.WAIT_FOR_TIME:
        return <Clock className="h-4 w-4" />
      case actionTypes.RELEASE_TRIGGER:
        return <Send className="h-4 w-4" />
      case actionTypes.HORN:
        return <Volume2 className="h-4 w-4" />
      case actionTypes.ANNOUNCE:
        return <MessageSquare className="h-4 w-4" />
      case actionTypes.ROTATE:
        return <RotateCcw className="h-4 w-4" />
    }
  }

  const getActionSummary = (action) => {
    switch (action.type) {
      case actionTypes.MOVE:
        return action.config?.location ? `to ${action.config.location}` : "to location"
      case actionTypes.LATCH:
        return "connect"
      case actionTypes.UNLATCH:
        return "disconnect"
      case actionTypes.REVERSE:
        return action.config?.presetName ? `(${action.config.presetName})` : "reverse"
      case actionTypes.WAIT_FOR_TRIGGER:
        return action.config?.trigger_id ? `for ${action.config.trigger_id}` : "for signal"
      case actionTypes.WAIT_FOR_TIME:
        return action.config?.wait_time ? `for ${action.config.wait_time}s` : "for time"
      case actionTypes.RELEASE_TRIGGER:
        return action.config?.wait_id ? `signal ${action.config.wait_id}` : "send signal"
      case actionTypes.HORN:
        return action.config?.horn ? `${action.config.horn} (${action.config.repetitions || 1}x)` : "horn"
      case actionTypes.ANNOUNCE:
        return action.config?.announcement ? `"${action.config.announcement}" (${action.config.repetitions || 1}x)` : "announce"
      case actionTypes.ROTATE:
        return action.config?.target_diff ? `${action.config.target_diff}°` : "rotate"
    }
  }

  // Add a drop preview indicator
  const dropPreview = isOver && (
    <div className="h-1 w-full bg-blue-500 my-2 rounded-full"></div>
  )

  return (
    <>
      {isOver && index === 0 && <div className="h-1 w-full bg-blue-500 my-2 rounded-full"></div>}
      <div
        ref={ref}
        style={{ 
          marginBottom: isDragging ? '2rem' : '0.5rem',
          transition: 'margin 0.2s ease'
        }}
        className={`
          flex items-center relative z-10 transition-all
          ${isSelected ? "ring-2 ring-blue-500" : "hover:shadow-md"}
          ${isDragging ? "opacity-50" : "opacity-100"}
          ${isOver ? "transform translate-y-2" : ""}
        `}
        onClick={onSelect}
      >
        {/* Action content */}
        <div
          className={`
          flex items-center p-2 rounded-md border flex-1
        `}
        >
          {/* Drag handle */}
          <div
            className="cursor-move p-1 mr-2"
            onMouseDown={(e) => {
              // This prevents the card's onClick from firing when dragging starts from the handle
              e.stopPropagation()
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>

          <div className="flex items-center gap-2 flex-1">
            {getIcon(action.type)}
            <div>
              <div className="font-medium text-sm">{action.type}</div>
              <div className="text-xs">{getActionSummary(action)}</div>
            </div>
          </div>

          {/* Delete button */}
          <button
            className="p-1 text-red-400 hover:bg-red-900 hover:text-red-200 rounded-full"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      {isOver && index === totalItems - 1 && <div className="h-1 w-full bg-blue-500 my-2 rounded-full"></div>}
    </>
  )
}
