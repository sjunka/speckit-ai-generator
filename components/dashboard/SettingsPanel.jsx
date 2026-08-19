"use client";

import { useState } from "react";

const QUALITY_OPTIONS = [
  { value: "lite", label: "Lite (lowest cost, fastest)" },
  { value: "standard", label: "Standard" },
  { value: "turbo", label: "Turbo (highest cost)" },
];

const patch = (body) =>
  fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export const SettingsPanel = ({ initial }) => {
  const [settings, setSettings] = useState(initial);

  const update = (field) => (event) => {
    const value = field === "enabled" ? event.target.checked : event.target.value;
    setSettings((current) => ({ ...current, [field]: value }));
    patch({ [field]: value });
  };

  return (
    <>
      <div className="bg-surface-1 border border-hairline rounded-lg p-6">
        <label className="flex items-center gap-4">
          <span className="heading">Generation</span>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={update("enabled")}
            className="w-6 h-6"
          />
        </label>
        {!settings.enabled && (
          <p className="text-sm text-success mt-2">Generation is paused</p>
        )}
      </div>

      <div className="bg-surface-1 border border-hairline rounded-lg p-6">
        <label className="flex items-center gap-4">
          <span className="heading">Video quality</span>
          <select value={settings.videoQuality} onChange={update("videoQuality")} className="body-sm">
            {QUALITY_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
};
