"use client";

import { useState } from "react";

const QUALITY_OPTIONS = [
  { value: "lite", label: "Lite (lowest cost, fastest)" },
  { value: "standard", label: "Standard" },
  { value: "turbo", label: "Turbo (highest cost)" },
];

const patch = (body) => fetch("/api/settings", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const SettingsPanel = ({ initial }) => {
  const [settings, setSettings] = useState({ enabled: true, videoQuality: "lite", ...initial });

  const update = (field) => (event) => {
    const value = field === "enabled" ? event.target.checked : event.target.value;
    setSettings((current) => ({ ...current, [field]: value }));
    patch({ [field]: value });
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="bg-surface-1 border border-hairline rounded-lg p-6">
        <label className="flex min-h-11 items-center gap-4" htmlFor="generation-toggle">
          <span className="heading">Generation</span>
          <input id="generation-toggle" type="checkbox" checked={settings.enabled} onChange={update("enabled")} className="h-6 w-6 focus:outline-2 focus:outline-offset-2 focus:outline-primary" />
        </label>
        {!settings.enabled && <p className="body-sm text-success mt-2">Generation is paused</p>}
      </div>

      <div className="bg-surface-1 border border-hairline rounded-lg p-6">
        <label className="flex min-h-11 items-center gap-4" htmlFor="video-quality">
          <span className="heading">Video quality</span>
          <select id="video-quality" value={settings.videoQuality} onChange={update("videoQuality")} className="body-sm min-h-11 rounded-md border border-hairline bg-surface-2 px-3 focus:outline-2 focus:outline-offset-2 focus:outline-primary">
            {QUALITY_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
};
