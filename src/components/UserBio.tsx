"use client";

import { format } from "date-fns";
import { type ChangeEvent, useRef, useState } from "react";
import { AvatarCropDialog } from "@/components/AvatarCropDialog";
import { useAuth } from "@/components/AuthProvider";

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface UserBioProps {
  userId: string;
  name: string;
  information: string;
  imageUrl?: string;
  datejoin: string;
  onUpdated: () => void;
}

export function UserBio({
  userId,
  name,
  information,
  imageUrl = "",
  datejoin,
  onUpdated,
}: UserBioProps) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(information);
  const [avatarUrl, setAvatarUrl] = useState(imageUrl);
  const [busy, setBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [cropImageUrl, setCropImageUrl] = useState("");
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
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

  function closeCropDialog() {
    if (cropImageUrl) {
      URL.revokeObjectURL(cropImageUrl);
    }
    setCropImageUrl("");
  }

  function chooseAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarError("");

    if (!AVATAR_CONTENT_TYPES.includes(file.type)) {
      alert("Use a JPEG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > AVATAR_MAX_BYTES) {
      alert("Avatar must be 2MB or smaller.");
      event.target.value = "";
      return;
    }

    setCropImageUrl(URL.createObjectURL(file));
    event.target.value = "";
  }

  async function uploadAvatar(blob: Blob) {
    if (blob.size > AVATAR_MAX_BYTES) {
      alert("Avatar must be 2MB or smaller.");
      return;
    }

    setAvatarBusy(true);
    try {
      const uploadUrlResponse = await fetch(
        `/api/users/${userId}/avatar/upload-url`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType: "image/webp",
            size: blob.size,
          }),
        },
      );
      const uploadUrlData = await uploadUrlResponse.json();

      if (!uploadUrlResponse.ok) {
        setAvatarError(uploadUrlData.error ?? "Could not prepare upload.");
        return;
      }

      const formData = new FormData();
      for (const [key, value] of Object.entries(
        uploadUrlData.fields as Record<string, string>,
      )) {
        formData.append(key, value);
      }
      formData.append("file", blob, "avatar.webp");

      const uploadResponse = await fetch(uploadUrlData.uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        setAvatarError("Upload rejected by S3. Check file type, size, and CORS.");
        return;
      }

      const saveResponse = await fetch(`/api/users/${userId}/avatar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageKey: uploadUrlData.imageKey }),
      });
      const saveData = await saveResponse.json();

      if (!saveResponse.ok) {
        setAvatarError(saveData.error ?? "Could not save avatar.");
        return;
      }

      setAvatarUrl(saveData.imageUrl);
      closeCropDialog();
      onUpdated();
    } catch {
      setAvatarError("Could not upload avatar.");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function removeAvatar() {
    if (!avatarUrl) return;

    setAvatarError("");
    setAvatarBusy(true);
    try {
      const response = await fetch(`/api/users/${userId}/avatar`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        setAvatarError(data.error ?? "Could not remove avatar.");
        return;
      }

      setAvatarUrl("");
      setShowRemoveDialog(false);
      onUpdated();
    } catch {
      setAvatarError("Could not remove avatar.");
    } finally {
      setAvatarBusy(false);
    }
  }

  let joinLabel = datejoin;
  try {
    joinLabel = format(new Date(datejoin), "MMMM d, yyyy");
  } catch {
    // keep raw string
  }

  return (
    <>
      {cropImageUrl && (
        <AvatarCropDialog
          imageUrl={cropImageUrl}
          onCancel={closeCropDialog}
          onSave={uploadAvatar}
        />
      )}

      {showRemoveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="ui-panel w-full max-w-md border-border p-5">
            <h2 className="ui-title text-base font-medium no-underline">
              remove profile photo?
            </h2>
            <p className="ui-muted mt-3 text-sm leading-relaxed">
              This will remove the current avatar from your profile and delete
              the uploaded file from storage.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={avatarBusy}
                onClick={() => setShowRemoveDialog(false)}
                className="ui-btn"
              >
                [ cancel ]
              </button>
              <button
                type="button"
                disabled={avatarBusy}
                onClick={removeAvatar}
                className="ui-btn text-red-400"
              >
                {avatarBusy ? "[ removing... ]" : "[ remove photo ]"}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="ui-panel profile-card">
        <div className="profile-identity">
          <div className="profile-avatar">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={`${name}'s avatar`} />
            ) : (
              <span>{name.slice(0, 1).toUpperCase()}</span>
            )}
          </div>

          <h1 className="ui-title text-2xl font-medium">{name}</h1>
          <p className="ui-muted text-sm">joined {joinLabel}</p>
        </div>

        {isOwner && (
          <div className="profile-actions">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={chooseAvatar}
              className="hidden"
            />
            <button
              type="button"
              disabled={avatarBusy}
              onClick={() => inputRef.current?.click()}
              className="ui-btn ui-btn-accent profile-action"
            >
              {avatarBusy
                ? "[ uploading... ]"
                : avatarUrl
                  ? "[ change photo ]"
                  : "[ add photo ]"}
            </button>
            {avatarUrl && (
              <button
                type="button"
                disabled={avatarBusy}
                onClick={() => setShowRemoveDialog(true)}
                className="ui-btn profile-action text-red-400"
              >
                [ remove photo ]
              </button>
            )}
            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="ui-btn profile-action"
              >
                [ edit bio ]
              </button>
            )}
          </div>
        )}

        {avatarError && (
          <p className="profile-error border border-red-400/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
            {avatarError}
          </p>
        )}

        <div className="profile-bio-card">
          <p className="ui-muted profile-bio-label text-xs">Bio</p>
          {editing ? (
            <div className="space-y-3">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={150}
                rows={3}
                className="ui-input"
              />
              <div className="flex flex-wrap justify-end gap-2">
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
                <button
                  type="button"
                  disabled={busy}
                  onClick={saveBio}
                  className="ui-btn ui-btn-accent"
                >
                  [ save ]
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-relaxed">
              {information || (
                <span className="ui-muted italic">no bio yet.</span>
              )}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
