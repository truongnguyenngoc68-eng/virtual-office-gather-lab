import { useState, useEffect } from "react";
import { useEvents } from "../../contexts/EventContext";
import { useSocket } from "../../contexts/SocketContext";

interface EventModalProps {
  event?: any;
  selectedDate?: Date;
  onClose: () => void;
}

const EventModal = ({ event, selectedDate, onClose }: EventModalProps) => {
  const { createEvent, updateEvent, deleteEvent, rsvpEvent } = useEvents();
  const { currentUser } = useSocket();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description);
      setStartTime(new Date(event.startTime).toISOString().slice(0, 16));
      setEndTime(new Date(event.endTime).toISOString().slice(0, 16));
      setLocation(event.location);
    } else if (selectedDate) {
      const dateStr = selectedDate.toISOString().slice(0, 10);
      setStartTime(`${dateStr}T10:00`);
      setEndTime(`${dateStr}T11:00`);
    }
  }, [event, selectedDate]);

  const handleSave = async () => {
    if (!title.trim() || !startTime || !endTime) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      if (event) {
        await updateEvent(event.eventId, {
          title,
          description,
          startTime,
          endTime,
          location,
        });
      } else {
        await createEvent({
          title,
          description,
          startTime,
          endTime,
          location,
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Failed to save event");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !confirm("Are you sure you want to delete this event?"))
      return;

    try {
      await deleteEvent(event.eventId);
      onClose();
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    }
  };

  const handleRSVP = async (status: "going" | "maybe" | "not_going") => {
    if (!event) return;
    await rsvpEvent(event.eventId, status);
  };

  const userRSVP = event?.attendees?.find(
    (a: any) => a.userId === currentUser?.userId
  )?.status;

  // ESC to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10006] animate-[fadeIn_0.2s_ease-in]" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl w-[90%] max-w-[500px] max-h-[90vh] flex flex-col shadow-2xl animate-[slideUp_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="m-0 text-xl font-semibold text-gray-50">{event ? "Edit Event" : "Create Event"}</h2>
          <button className="bg-transparent border-none text-gray-400 text-[32px] leading-none cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded transition-all hover:bg-gray-700 hover:text-gray-50" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="mb-4">
            <label className="block mb-1.5 text-sm font-medium text-gray-300">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-md text-gray-50 text-sm font-inherit focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="mb-4">
              <label className="block mb-1.5 text-sm font-medium text-gray-300">Start Time *</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-md text-gray-50 text-sm font-inherit focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1.5 text-sm font-medium text-gray-300">End Time *</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-md text-gray-50 text-sm font-inherit focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block mb-1.5 text-sm font-medium text-gray-300">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Event location"
              className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-md text-gray-50 text-sm font-inherit focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1.5 text-sm font-medium text-gray-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event description"
              rows={4}
              className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-md text-gray-50 text-sm font-inherit focus:outline-none focus:border-indigo-600"
            />
          </div>

          {event && (
            <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
              <h3 className="m-0 mb-3 text-base font-semibold text-gray-50">RSVP</h3>
              <div className="flex gap-2 mb-4">
                <button
                  className={`flex-1 px-4 py-2 rounded-md text-[13px] font-medium cursor-pointer transition-all ${
                    userRSVP === "going"
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600"
                  }`}
                  onClick={() => handleRSVP("going")}
                >
                  ✓ Going
                </button>
                <button
                  className={`flex-1 px-4 py-2 rounded-md text-[13px] font-medium cursor-pointer transition-all ${
                    userRSVP === "maybe"
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600"
                  }`}
                  onClick={() => handleRSVP("maybe")}
                >
                  ? Maybe
                </button>
                <button
                  className={`flex-1 px-4 py-2 rounded-md text-[13px] font-medium cursor-pointer transition-all ${
                    userRSVP === "not_going"
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600"
                  }`}
                  onClick={() => handleRSVP("not_going")}
                >
                  ✗ Not Going
                </button>
              </div>
              <div>
                <h4 className="m-0 mb-2 text-sm font-medium text-gray-300">Attendees ({event.attendees?.length || 0})</h4>
                {event.attendees?.map((attendee: any) => (
                  <div key={attendee.userId} className="flex items-center justify-between p-2 bg-gray-800 rounded mb-1 text-[13px] text-gray-50">
                    <span>{attendee.username}</span>
                    <span className={`font-semibold ${
                      attendee.status === "going" ? "text-green-500" :
                      attendee.status === "maybe" ? "text-amber-500" :
                      "text-red-500"
                    }`}>
                      {attendee.status === "going" && "✓"}
                      {attendee.status === "maybe" && "?"}
                      {attendee.status === "not_going" && "✗"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-700">
            {event && event.createdBy === currentUser?.userId && (
              <button className="px-5 py-2.5 rounded-md border-none text-sm font-medium cursor-pointer transition-all bg-red-500 text-white hover:bg-red-600" onClick={handleDelete}>
                Delete
              </button>
            )}
            <div className="flex gap-3 ml-auto">
              <button className="px-5 py-2.5 rounded-md border-none text-sm font-medium cursor-pointer transition-all bg-gray-700 text-gray-50 hover:bg-gray-600" onClick={onClose}>
                Cancel
              </button>
              <button
                className="px-5 py-2.5 rounded-md border-none text-sm font-medium cursor-pointer transition-all bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;

