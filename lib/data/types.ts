import type { Timestamp } from "firebase-admin/firestore";

export type SeriesRecord = {
  name: string;
  startDate: Timestamp;
  endDate: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
};

export type SessionRecord = {
  seriesId: string;
  startAt: Timestamp;
  checkinOpenAt: Timestamp;
  checkinCloseAt: Timestamp;
  token: string | null;
  createdAt: Timestamp;
};

export type AttendanceRecord = {
  kidId: string;
  seriesId: string;
  sessionId: string;
  timestamp: Timestamp;
};

export type Series = SeriesRecord & { id: string };
export type Session = SessionRecord & { id: string };
export type Attendance = AttendanceRecord & { id: string };
