"use client";

import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

interface AvatarCropDialogProps {
  imageUrl: string;
  onCancel: () => void;
  onSave: (blob: Blob) => void | Promise<void>;
}

async function createCroppedAvatarBlob(imageUrl: string, crop: Area) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageUrl;
  });

  const canvas = document.createElement("canvas");
  const size = 512;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create image canvas.");
  }

  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    size,
    size,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not crop image."));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      0.9,
    );
  });
}

export function AvatarCropDialog({
  imageUrl,
  onCancel,
  onSave,
}: AvatarCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function saveCrop() {
    if (!croppedAreaPixels) return;

    setBusy(true);
    setError("");
    try {
      await onSave(await createCroppedAvatarBlob(imageUrl, croppedAreaPixels));
    } catch {
      setError("Could not crop image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="ui-panel w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="ui-title text-sm font-medium no-underline">
            crop profile photo
          </h2>
          <button type="button" onClick={onCancel} className="ui-btn">
            [ x ]
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div className="avatar-crop-area">
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
            />
          </div>

          <div>
            <label htmlFor="avatar-zoom" className="ui-muted mb-2 block text-sm">
              zoom
            </label>
            <input
              id="avatar-zoom"
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full"
            />
          </div>

          {error && (
            <p className="border border-red-400/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="ui-btn">
              [ cancel ]
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={saveCrop}
              className="ui-btn ui-btn-accent"
            >
              {busy ? "[ saving... ]" : "[ save photo ]"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
