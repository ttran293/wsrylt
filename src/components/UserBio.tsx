"use client";

import { format } from "date-fns";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

interface UserBioProps {
  userId: string;
  name: string;
  information: string;
  datejoin: string;
  onUpdated: () => void;
}

export function UserBio({
  userId,
  name,
  information,
  datejoin,
  onUpdated,
}: UserBioProps) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(information);
  const [busy, setBusy] = useState(false);
  const isOwner = user?.userId === userId;

  async function saveBio() {
    setBusy(true);
    try {
      await fetch(`/api/users/${userId}/bio`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: bio }),
      });
      setEditing(false);
      onUpdated();
    } finally {
      setBusy(false);
    }
  }

  let joinLabel = datejoin;
  try {
    joinLabel = format(new Date(datejoin), "MMMM d, yyyy");
  } catch {
    // keep raw string
  }

  return (
    <section className="ui-panel p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="ui-title text-2xl font-medium">{name}</h1>
          <p className="ui-muted mt-1 text-sm">joined {joinLabel}</p>
        </div>
        {isOwner && !editing && (
          <button type="button" onClick={() => setEditing(true)} className="ui-btn">
            [ edit bio ]
          </button>
        )}
      </div>

      <div className="mt-4">
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={150}
              rows={3}
              className="ui-input"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={saveBio}
                className="ui-btn ui-btn-accent"
              >
                [ save ]
              </button>
              <button
                type="button"
                onClick={() => {
                  setBio(information);
                  setEditing(false);
                }}
                className="ui-btn"
              >
                [ cancel ]
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm">
            {information || (
              <span className="ui-muted italic">no bio yet.</span>
            )}
          </p>
        )}
      </div>
    </section>
  );
}
