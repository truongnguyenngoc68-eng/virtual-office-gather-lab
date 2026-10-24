import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useSocket } from "./SocketContext";
import { authFetch } from "../utils/authFetch";
import { useToast } from "./ToastContext";

export interface Event {
  eventId: string;
  roomId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  createdBy: string;
  attendees: Array<{
    userId: string;
    username: string;
    status: "going" | "maybe" | "not_going";
  }>;
  location: string;
  isRecurring: boolean;
  recurrencePattern?: string;
}

interface EventContextType {
  events: Event[];
  loading: boolean;
  fetchEvents: () => Promise<void>;
  createEvent: (event: Partial<Event>) => Promise<Event | null>;
  updateEvent: (eventId: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  rsvpEvent: (eventId: string, status: "going" | "maybe" | "not_going") => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEvents must be used within EventProvider");
  }
  return context;
};

interface EventProviderProps {
  children: ReactNode;
}

export const EventProvider = ({ children }: EventProviderProps) => {
  const { currentUser } = useSocket();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const fetchEvents = useCallback(async () => {
    const roomId = localStorage.getItem("roomId") || "default-room";
    if (!roomId) return;

    setLoading(true);
    try {
      const response = await authFetch(
        `${
          import.meta.env.VITE_SERVER_URL || "http://localhost:5001"
        }/api/spaces/${roomId}/events`
      );
      if (response.ok) {
        const data = await response.json();
        setEvents(data || []);
      } else if (response.status === 404) {
        // Room might not have events yet, set empty array
        setEvents([]);
      } else {
        console.error("Failed to fetch events:", response.status);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvent = async (event: Partial<Event>): Promise<Event | null> => {
    const roomId = localStorage.getItem("roomId") || "default-room";
    if (!currentUser || !roomId) {
      console.error("Cannot create event: missing currentUser or roomId");
      return null;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await authFetch(
        `${
          import.meta.env.VITE_SERVER_URL || "http://localhost:5001"
        }/api/spaces/${roomId}/events`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...event,
            roomId,
            createdBy: currentUser.userId,
          }),
        }
      );

      if (response.ok) {
        const newEvent = await response.json();
        await fetchEvents();
        showToast("Tạo sự kiện thành công", { variant: "success" });
        return newEvent;
      } else {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        console.error("Failed to create event:", response.status, errorData);
        showToast(`Không thể tạo sự kiện: ${errorData.message || "Lỗi không xác định"}`, {
          variant: "error",
        });
        return null;
      }
    } catch (error) {
      console.error("Error creating event:", error);
      showToast("Lỗi khi tạo sự kiện. Vui lòng thử lại.", { variant: "error" });
      return null;
    }
  };

  const updateEvent = async (
    eventId: string,
    updates: Partial<Event>
  ): Promise<void> => {
    try {
      const token = localStorage.getItem("token");
      const response = await authFetch(
        `${
          import.meta.env.VITE_SERVER_URL || "http://localhost:5001"
        }/api/spaces/events/${encodeURIComponent(eventId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        }
      );

      if (response.ok) {
        await fetchEvents();
      } else {
        const err = await response.json().catch(() => ({}));
        console.error("Failed to update event:", response.status, err);
      }
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const deleteEvent = async (eventId: string): Promise<void> => {
    try {
      const token = localStorage.getItem("token");
      const response = await authFetch(
        `${
          import.meta.env.VITE_SERVER_URL || "http://localhost:5001"
        }/api/spaces/events/${encodeURIComponent(eventId)}`,
        {
          method: "DELETE",
          headers: {},
        }
      );

      if (response.ok) {
        await fetchEvents();
      } else {
        const err = await response.json().catch(() => ({}));
        console.error("Failed to delete event:", response.status, err);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const rsvpEvent = async (
    eventId: string,
    status: "going" | "maybe" | "not_going"
  ): Promise<void> => {
    if (!currentUser) return;

    try {
      const token = localStorage.getItem("token");
      const response = await authFetch(
        `${
          import.meta.env.VITE_SERVER_URL || "http://localhost:5001"
        }/api/spaces/events/${encodeURIComponent(eventId)}/rsvp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentUser.userId,
            username: currentUser.username,
            status,
          }),
        }
      );

      if (response.ok) {
        await fetchEvents();
      } else {
        const err = await response.json().catch(() => ({}));
        console.error("Failed to RSVP:", response.status, err);
      }
    } catch (error) {
      console.error("Error RSVPing event:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <EventContext.Provider
      value={{
        events,
        loading,
        fetchEvents,
        createEvent,
        updateEvent,
        deleteEvent,
        rsvpEvent,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};
