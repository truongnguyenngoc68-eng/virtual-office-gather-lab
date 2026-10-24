import { Request, Response } from "express";
import Event from "../models/Event.js";
import EventTemplate from "../models/EventTemplate.js";
import {
  generateRecurringEvents,
  calculateReminderTimes,
} from "../utils/recurringEvents.js";
import { logger } from "../utils/logger.js";

// Get events for a room
export const getEventsByRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const { startDate, endDate } = req.query;

    interface QueryType {
      roomId: string;
      startTime?: {
        $gte: Date;
        $lte: Date;
      };
    }

    const query: QueryType = { roomId };

    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const events = await Event.find(query).sort({ startTime: 1 });
    res.json(events);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

// Create event
export const createEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      roomId,
      title,
      description,
      startTime,
      endTime,
      createdBy,
      location,
      maxParticipants,
      isRecurring,
      recurrencePattern,
      templateId,
      reminders,
    } = req.body;

    // If using template, load defaults
    let template = null;
    if (templateId) {
      template = await EventTemplate.findById(templateId);
      if (template) {
        // Increment usage count
        template.usageCount = (template.usageCount || 0) + 1;
        await template.save();
      }
    }

    const eventId = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Calculate reminder times
    const reminderMinutes = reminders || template?.defaultReminders || [15, 60];
    const reminderTimes = calculateReminderTimes(start, reminderMinutes);
    const reminderObjects = reminderTimes.map((time) => ({
      minutesBefore: Math.round((start.getTime() - time.getTime()) / (1000 * 60)),
      sent: false,
    }));

    const event = new Event({
      eventId,
      roomId,
      title: title || template?.name || "Untitled Event",
      description: description || template?.description || "",
      startTime: start,
      endTime: end,
      createdBy,
      location: location || template?.defaultLocation || "",
      maxParticipants: maxParticipants || template?.defaultMaxParticipants,
      isRecurring: isRecurring || false,
      recurrencePattern: recurrencePattern || null,
      templateId: templateId || null,
      reminders: reminderObjects,
      attendance: {
        registered: 0,
        attended: 0,
        noShow: 0,
      },
    });

    await event.save();

    // If recurring, generate instances
    if (isRecurring && recurrencePattern) {
      const instances = generateRecurringEvents(start, end, recurrencePattern);
      const duration = end.getTime() - start.getTime();

      for (let i = 1; i < instances.length; i++) {
        const instanceStart = instances[i];
        const instanceEnd = new Date(instanceStart.getTime() + duration);
        const instanceEventId = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const instanceEvent = new Event({
          eventId: instanceEventId,
          roomId,
          title: event.title,
          description: event.description,
          startTime: instanceStart,
          endTime: instanceEnd,
          createdBy,
          location: event.location,
          maxParticipants: event.maxParticipants,
          isRecurring: false, // Instances are not recurring
          parentEventId: event._id,
          templateId: event.templateId,
          reminders: reminderObjects.map((r) => ({ ...r })), // Copy reminders
          attendance: {
            registered: 0,
            attended: 0,
            noShow: 0,
          },
        });

        await instanceEvent.save();
      }
    }

    res.status(201).json(event);
  } catch (error) {
    logger.error("Failed to create event", error as Error);
    res.status(400).json({ message: (error as Error).message });
  }
};

// Update event
export const updateEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const updates = req.body;

    const event = await Event.findOne({ eventId });
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    if (updates.title) event.title = updates.title;
    if (updates.description !== undefined) event.description = updates.description;
    if (updates.startTime) event.startTime = new Date(updates.startTime);
    if (updates.endTime) event.endTime = new Date(updates.endTime);
    if (updates.location !== undefined) event.location = updates.location;

    await event.save();
    res.json(event);
  } catch (error) {
    const err = error as Error;
    res.status(400).json({ message: err.message });
  }
};

// RSVP to event
export const rsvpEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { userId, username, status } = req.body;

    const event = await Event.findOne({ eventId });
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    // Check max participants
    if (
      status === "going" &&
      event.maxParticipants &&
      event.attendees.filter((a) => a.status === "going").length >=
        event.maxParticipants
    ) {
      res.status(400).json({ message: "Event is full" });
      return;
    }

    const attendeeIndex = event.attendees.findIndex(
      (a) => a.userId === userId
    );

    const oldStatus = attendeeIndex >= 0 ? event.attendees[attendeeIndex].status : null;

    if (attendeeIndex >= 0) {
      event.attendees[attendeeIndex].status = status;
    } else {
      event.attendees.push({ userId, username, status });
    }

    // Update attendance counts
    if (oldStatus === "going" && status !== "going") {
      event.attendance.registered = Math.max(0, event.attendance.registered - 1);
    } else if (oldStatus !== "going" && status === "going") {
      event.attendance.registered = (event.attendance.registered || 0) + 1;
    }

    await event.save();
    res.json(event);
  } catch (error) {
    logger.error("Failed to RSVP to event", error as Error);
    res.status(400).json({ message: (error as Error).message });
  }
};

// Mark attendance (for event host)
export const markAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { userId, attended } = req.body;

    const event = await Event.findOne({ eventId });
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    // Check if user is creator or has permission
    const requestUserId = (req as any).userId;
    if (event.createdBy !== requestUserId) {
      res.status(403).json({ message: "Only event creator can mark attendance" });
      return;
    }

    const attendee = event.attendees.find((a) => a.userId === userId);
    if (!attendee) {
      res.status(404).json({ message: "User not registered for event" });
      return;
    }

    // Update attendance counts
    if (attended) {
      if (attendee.status === "going" && !attendee.attended) {
        event.attendance.attended = (event.attendance.attended || 0) + 1;
        attendee.attended = true;
      }
    } else {
      if (attendee.attended) {
        event.attendance.attended = Math.max(0, (event.attendance.attended || 0) - 1);
        event.attendance.noShow = (event.attendance.noShow || 0) + 1;
        attendee.attended = false;
      }
    }

    await event.save();
    res.json(event);
  } catch (error) {
    logger.error("Failed to mark attendance", error as Error);
    res.status(400).json({ message: (error as Error).message });
  }
};

// Delete event
export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;

    const event = await Event.findOneAndDelete({ eventId });
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

