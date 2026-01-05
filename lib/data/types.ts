import type { Timestamp } from "firebase-admin/firestore";

export type SeriesRecord = {
  name: string;
  startDate: Timestamp;
  isActive: boolean;
  completed: boolean;
  createdBy: string;
  createdAt: Timestamp;
};

export type SessionRecord = {
  seriesId: string;
  startAt: Timestamp;
  checkinOpenAt: Timestamp;
  checkinCloseAt: Timestamp;
  token: string | null;
  createdBy: string;
  createdAt: Timestamp;
};

export type AttendanceRecord = {
  participantId: string;
  seriesId: string;
  sessionId: string;
  timestamp: Timestamp;
};

export type Series = SeriesRecord & { id: string };
export type Session = SessionRecord & { id: string };
export type Attendance = AttendanceRecord & { id: string };
