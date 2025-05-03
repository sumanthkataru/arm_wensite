"use client"

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
// Mock API data for configuration options
const API_DATA = {
  locations: [
    "Loading Bay",
    "Assembly Line A",
    "Assembly Line B",
    "Warehouse Zone 1",
    "Warehouse Zone 2",
    "Charging Station",
    "Maintenance Area",
    "Shipping Dock",
  ],
  signals: [
    "Button Press",
    "Door Open",
    "Line Cleared",
    "Package Detected",
    "Battery Low",
    "Emergency Stop Released",
    "Operator Confirmation",
  ],
  hornSounds: [
    "stop-0",
    "caution",
    "warning",
    "emergency",
  ],
  announcements: [
    "Clear Path - Kannada",
    "Clear Path - English",
    "Emergency evacuation - Kannada",
    "Emergency evacuation - English",
  ],
  hitches :[
    "True",
    "False"
  ],
  reversePresets: [
    { 
      name: "Standard Reverse",
      config: {
        // name: "ORGIN", 
        // state: "ORGIN_rev", 
        y_threshold: 0.02, 
        x_threshold: 0, 
        ka_1: -50, 
        ka_2: -50, 
        kc: 0, 
        speed: 10, 
        angle_factor: 1.5,
        zone: 99, 
        vehicle_latch_distance: -0.7, 
        latch_project_dist: 0.7, 
        hitch: false
      }
    },
    { 
      name: "Precision Reverse",
      config: {
        // name: "ORGIN", 
        // state: "ORGIN_rev", 
        y_threshold: 0.01, 
        x_threshold: 0, 
        ka_1: -60, 
        ka_2: -60, 
        kc: 0, 
        speed: 5, 
        angle_factor: 2.0,
        zone: 99, 
        vehicle_latch_distance: -0.5, 
        latch_project_dist: 0.5, 
        hitch: false
      }
    },
    { 
      name: "High Speed Reverse",
      config: {
        // name: "ORGIN", 
        // state: "ORGIN_rev", 
        y_threshold: 0.05, 
        x_threshold: 0, 
        ka_1: -40, 
        ka_2: -40, 
        kc: 0, 
        speed: 15, 
        angle_factor: 1.2,
        zone: 99, 
        vehicle_latch_distance: -0.7, 
        latch_project_dist: 0.7, 
        hitch: false
      }
    }
  ]
}

export function ConfigPanel({ selectedAction, onUpdateAction, actionTypes }) {
  if (!selectedAction) {
    return (
      <div className="w-1/4 bg-gray-900 p-3 border-l border-gray-800">
        <h2 className="text-xl font-bold mb-3 text-white">Configuration</h2>
        <div className="text-gray-400 text-center p-8">Select an action to configure it</div>
      </div>
    )
  }

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
    }
  }

  const handleChange = (key, value) => {
    if (onUpdateAction) {
      onUpdateAction({
        ...selectedAction.config,
        [key]: value,
      })
    }
  }

  // For reverse action, handle preset selection
  const handleReversePresetChange = (presetName) => {
    const preset = API_DATA.reversePresets.find(p => p.name === presetName);
    if (preset && onUpdateAction) {
      onUpdateAction({
        ...selectedAction.config,     
        ...preset.config,
        presetName
      });
    }
  }

  

  return (
    <div className="w-1/4 bg-gray-900 p-3 border-l border-gray-800 overflow-y-auto">
      <h2 className="text-xl font-bold mb-3 text-white">Configuration</h2>

      <div className="bg-gray-800 border border-gray-700 rounded-md shadow-sm">
        <div className="p-3 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center gap-2 font-medium">
            {getIcon(selectedAction.type)}
            {selectedAction.type}
          </div>
        </div>
        <div className="p-3">
          {selectedAction.type === actionTypes.MOVE && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="location" className="block text-sm font-medium text-gray-300">
                  Location
                </label>
                <select
                  id="location"
                  value={selectedAction.config?.location || ""}
                  onChange={(e) => handleChange("location", e.target.value)}
                  className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a location</option>
                  {API_DATA.locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {selectedAction.type === actionTypes.WAIT_FOR_TRIGGER && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="trigger_id" className="block text-sm font-medium text-gray-300">
                  Signal
                </label>
                <select
                  id="trigger_id"
                  value={selectedAction.config?.trigger_id || ""}
                  onChange={(e) => handleChange("trigger_id", e.target.value)}
                  className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a signal</option>
                  {API_DATA.signals.map((signal) => (
                    <option key={signal} value={signal}>
                      {signal}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {selectedAction.type === actionTypes.WAIT_FOR_TIME && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="wait_time" className="block text-sm font-medium text-gray-300">
                  Wait Time (seconds)
                </label>
                <input
                  type="number"
                  id="wait_time"
                  min="1"
                  max="60"
                  value={selectedAction.config?.wait_time || 3}
                  onChange={(e) => handleChange("wait_time", parseInt(e.target.value))}
                  className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {selectedAction.type === actionTypes.RELEASE_TRIGGER && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="wait_id" className="block text-sm font-medium text-gray-300">
                  Trigger ID
                </label>
                <select
                  id="wait_id"
                  value={selectedAction.config?.wait_id || ""}
                  onChange={(e) => handleChange("wait_id", e.target.value)}
                  className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a trigger</option>
                  {API_DATA.signals.map((signal) => (
                    <option key={signal} value={signal}>
                      {signal}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  State
                </label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="state"
                      checked={selectedAction.config?.state === true}
                      onChange={() => handleChange("state", true)}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-gray-300">Active</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="state"
                      checked={selectedAction.config?.state === false}
                      onChange={() => handleChange("state", false)}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-gray-300">Inactive</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {selectedAction.type === actionTypes.HORN && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="horn" className="block text-sm font-medium text-gray-300">
                  Horn Sound
                </label>
                <select
                  id="horn"
                  value={selectedAction.config?.horn || ""}
                  onChange={(e) => handleChange("horn", e.target.value)}
                  className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a sound</option>
                  {API_DATA.hornSounds.map((sound) => (
                    <option key={sound} value={sound}>
                      {sound}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="repetitions" className="block text-sm font-medium text-gray-300">
                  Repetitions
                </label>
                <input
                  type="number"
                  id="repetitions"
                  min="1"
                  max="10"
                  value={selectedAction.config?.repetitions || 1}
                  onChange={(e) => handleChange("repetitions", parseInt(e.target.value))}
                  className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {selectedAction.type === actionTypes.ANNOUNCE && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="announcement" className="block text-sm font-medium text-gray-300">
                  Announcement
                </label>
                <select
                  id="announcement"
                  value={selectedAction.config?.announcement || ""}
                  onChange={(e) => handleChange("announcement", e.target.value)}
                  className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select an announcement</option>
                  {API_DATA.announcements.map((announcement) => (
                    <option key={announcement} value={announcement}>
                      {announcement}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="announcementRepetitions" className="block text-sm font-medium text-gray-300">
                  Repetitions
                </label>
                <input
                  type="number"
                  id="announcementRepetitions"
                  min="1"
                  max="5"
                  value={selectedAction.config?.repetitions || 1}
                  onChange={(e) => handleChange("repetitions", parseInt(e.target.value))}
                  className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* {selectedAction.type === actionTypes.ROTATE && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="steering_angle" className="block text-sm font-medium text-gray-300">
                  Steering Angle
                </label>
                <input
                  type="number"
                  id="steering_angle"
                  min="-90"
                  max="90"
                  step="5"
                  value={selectedAction.config?.steering_angle || 0}
                  onChange={(e) => handleChange("steering_angle", parseInt(e.target.value))}
                  className="w-full bg-gray-700 rounded-md appearance-none h-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>-90°</span>
                  <span>{selectedAction.config?.steering_angle || 0}°</span>
                  <span>90°</span>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="target_diff" className="block text-sm font-medium text-gray-300">
                  Target Rotation
                </label>
                <input
                  type="range"
                  id="target_diff"
                  min="0"
                  max="360"
                  step="45"
                  value={selectedAction.config?.target_diff || 180}
                  onChange={(e) => handleChange("target_diff", parseInt(e.target.value))}
                  className="w-full bg-gray-700 rounded-md appearance-none h-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0°</span>
                  <span>{selectedAction.config?.target_diff || 180}°</span>
                  <span>360°</span>
                </div>
              </div>
            </div>
          )} */}
          {selectedAction.type === actionTypes.ROTATE && (
  <div className="space-y-4">
    <div className="space-y-2">
      <label htmlFor="steering_angle" className="block text-sm font-medium text-gray-300">
        Steering Angle (°)
      </label>
      <input
        type="number"
        id="steering_angle"
        min="-90"
        max="90"
        step="5"
        value={selectedAction.config?.steering_angle ?? 0}
        onChange={(e) => handleChange("steering_angle", parseFloat(e.target.value))}
        className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div className="space-y-2">
      <label htmlFor="target_diff" className="block text-sm font-medium text-gray-300">
        Target Rotation (°)
      </label>
      <input
        type="number"
        id="target_diff"
        min="0"
        max="360"
        step="45"
        value={selectedAction.config?.target_diff ?? 180}
        onChange={(e) => handleChange("target_diff", parseFloat(e.target.value))}
        className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  </div>
)}


          {selectedAction.type === actionTypes.REVERSE && (
            <div className="space-y-4">
              
                <div className="space-y-2">
            {/* Name Dropdown */}
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">
              Name
            </label>
            <select
                  id="name"
                  value={selectedAction.config?.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
              <option value="">Select a Name</option>
                        {API_DATA.locations.map((location) => (
                          <option key={location} value={location}>
                            {location}
                          </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {/* State Dropdown */}
            <label htmlFor="state" className="block text-sm font-medium text-gray-300">
              State
            </label>
            <select
              id="state"
              value={selectedAction.config?.state || ""}
              onChange={(e) => handleChange("state", e.target.value)}
              className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a State</option>
                        {API_DATA.locations.map((location) => (
                          <option key={location} value={location}>
                            {location}
                          </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
                <label htmlFor="reversePreset" className="block text-sm font-medium text-gray-300">
                  Reverse Preset
                </label>
                <select
                  id="reversePreset"
                  value={selectedAction.config?.presetName || ""}
                  onChange={(e) => handleReversePresetChange(e.target.value)}
                  className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a preset</option>
                  {API_DATA.reversePresets.map((preset) => (
                    <option key={preset.name} value={preset.name}>
                      {preset.name}
                    </option>
                  ))}
                </select>
                </div>
                {/* && selectedAction.config?.name && selectedAction.config?.state && selectedAction.config?.hitch */}
              {selectedAction.config?.presetName && (
                <div className="p-2 bg-gray-700 rounded-md text-xs text-gray-300">
                  <p className="font-semibold mb-1">Preset Configuration:</p>
                  {/* <p>Speed: {selectedAction.config?.speed || 10}</p>
                  <p>Angle Factor: {selectedAction.config?.angle_factor || 1.5}</p> */}
                  <p>Y_Threshold : {selectedAction.config?.y_threshold || 0.02}</p> 
                  <p>X_Threshold : {selectedAction.config?.x_threshold || 0}</p>
                  <p>Ka_1 : {selectedAction.config?.ka_1 || -50}</p> 
                  <p>Ka_2 : {selectedAction.config?.ka_2 || -50}</p> 
                  <p>Kc : {selectedAction.config?.kc || 0}</p> 
                  <p>Speed : {selectedAction.config?.speed || 10}</p> 
                  <p>Angle Factor : {selectedAction.config?.angle_factor || 1.5}</p> 
                  <p>zone : {selectedAction.config?.zone || 99}</p> 
                  <p>Vehicle Latch Distance : {selectedAction.config?.vehicle_latch_distance || -0.7}</p> 
                  <p>latch_project_dist : {selectedAction.config?.latch_project_dist || 0.7}</p> 
                </div>
              )}
            
          <div className="space-y-2">
            {/* Hitch Dropdown */}
            <label htmlFor="hitch" className="block text-sm font-medium text-gray-300">
              Hitch
            </label>
            <select
              id="hitch"
              value={selectedAction.config?.hitch || ""}
              onChange={(e) => handleChange("hitch", e.target.value)}
              className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a hitch</option>
              {API_DATA.hitches.map((hitch) => (
                <option key={hitch} value={hitch}>
                  {hitch}
                </option>
              ))}
            </select>
            </div>
            
            </div>
          )}

          {(selectedAction.type === actionTypes.LATCH ||
            selectedAction.type === actionTypes.UNLATCH) && (
            <div className="py-2 text-gray-400">No additional configuration needed for this action.</div>
          )}
        </div>
      </div>
    </div>
  )
}
