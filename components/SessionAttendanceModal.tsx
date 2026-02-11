"use client";

import { useEffect, useRef, useState } from "react";
import SessionAttendeeRow from "@/components/SessionAttendeeRow";

type Attendee = {
  participantId: string;
  nickname: string | null;
  timestamp: string | null;
};

export default function SessionAttendanceModal({
  sessionId,
  seriesId,
  count
}: {
  sessionId: string;
  seriesId: string;
  count: number;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAttendees = async () => {
    setLoading(true);
    const response = await fetch(`/api/sessions/${sessionId}/attendance`, {
      cache: "no-store"
    });
    if (response.ok) {
      const payload = (await response.json()) as { attendees: Attendee[] };
      setAttendees(payload.attendees ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!dialogRef.current?.open) return;
    fetchAttendees();
  }, []);

  const handleOpen = () => {
    dialogRef.current?.showModal();
    fetchAttendees();
  };

  return (
    <>
      {count > 0 ? (
        <button type="button" className="attendance-pill" onClick={handleOpen}>
          {count} attended
        </button>
      ) : (
        <span>0 attended</span>
      )}
      <dialog
        className="modal"
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            dialogRef.current?.close();
          }
        }}
      >
        <div className="modal-header">
          <h3>Session attendance</h3>
          <button
            type="button"
            className="secondary"
            onClick={() => dialogRef.current?.close()}
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          {loading ? (
            <p>Loading attendees...</p>
          ) : attendees.length === 0 ? (
            <p>No attendance yet.</p>
          ) : (
            <div className="list-divided">
              {attendees.map((attendee) => (
                <SessionAttendeeRow
                  key={attendee.participantId}
                  seriesId={seriesId}
                  participantId={attendee.participantId}
                  nickname={attendee.nickname}
                  timestamp={attendee.timestamp}
                />
              ))}
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
