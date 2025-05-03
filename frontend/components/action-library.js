"use client"

import { useState } from "react"
import { 
  MapPin, 
  Link, 
  Unlink, 
  ArrowLeft, 
  Bell, 
  Clock, 
  Send, 
  Volume2, 
  MessageSquare,
  RotateCcw 
} from "lucide-react"

// Action descriptions for tooltips
const ACTION_DESCRIPTIONS = {
  "MOVE": "Move robot to a specific location",
  "LATCH": "Activate latch to connect trolleys",
  "UNLATCH": "Deactivate latch to disconnect trolleys",
  "REVERSE": "Move in reverse to connect with trolleys",
  "WAIT_FOR_TRIGGER": "Wait until a specific signal is received",
  "WAIT": "Wait for a specified amount of time",
  "RELEASE_TRIGGER": "Send a trigger signal",
  "HORN WITH CERTAIN REPETATIONS": "Sound the horn in a specific pattern",
  "PLAY ANY VOICE ANNOUNCEMENTS": "Play pre-recorded voice announcements",
  "ROTATE": "Rotate the robot to a specific orientation"
}

export function ActionLibrary({ onAddAction, actionTypes }) {
  const [activeTooltip, setActiveTooltip] = useState(null)

  const getIcon = (type) => {
    switch (type) {
      case actionTypes.MOVE:
        return <MapPin className="h-5 w-5" />
      case actionTypes.LATCH:
        return <Link className="h-5 w-5" />
      case actionTypes.UNLATCH:
        return <Unlink className="h-5 w-5" />
      case actionTypes.REVERSE:
        return <ArrowLeft className="h-5 w-5" />
      case actionTypes.WAIT_FOR_TRIGGER:
        return <Bell className="h-5 w-5" />
      case actionTypes.WAIT_FOR_TIME:
        return <Clock className="h-5 w-5" />
      case actionTypes.RELEASE_TRIGGER:
        return <Send className="h-5 w-5" />
      case actionTypes.HORN:
        return <Volume2 className="h-5 w-5" />
      case actionTypes.ANNOUNCE:
        return <MessageSquare className="h-5 w-5" />
      case actionTypes.ROTATE:
        return <RotateCcw className="h-5 w-5" />
      default:
        return null
    }
  }

  return (
    <div className="w-1/4 bg-gray-900  overflow-y-auto border-r border-gray-800">
      <h2 className="text-xl font-bold pb-3 text-white sticky top-0 bg-slate-900 shadow-2xl z-10 px-2">Action Library</h2>
      <div className="grid grid-cols-2 gap-2 p-2">
        {Object.values(actionTypes).map((type) => (
          <div
            key={type}
            className="relative"
            onMouseEnter={() => setActiveTooltip(type)}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            <button
              className="w-full h-20 p-2 rounded-md border transition-all hover:shadow-md flex flex-col items-center justify-center border-gray-700 text-white hover:bg-gray-800"
              onClick={() => onAddAction(type)}
              title={ACTION_DESCRIPTIONS[type] || type}
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-full mb-1">
                {getIcon(type)}
              </div>
              <span className="text-sm font-medium">{type}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
