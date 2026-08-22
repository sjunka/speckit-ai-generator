import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CameraCapture } from "./CameraCapture.jsx";

// Trap 1: navigator.mediaDevices is absent in jsdom — not undefined on an
// existing object. It has to be defined before it can be stubbed.
let getUserMedia;
let streams;

const fakeStream = () => {
  const stream = { tracks: [{ stop: vi.fn() }, { stop: vi.fn() }] };
  stream.getTracks = () => stream.tracks;
  streams.push(stream);
  return stream;
};

const defineMediaDevices = (value) =>
  Object.defineProperty(navigator, "mediaDevices", { value, configurable: true, writable: true });

beforeEach(() => {
  streams = [];
  getUserMedia = vi.fn(async () => fakeStream());
  defineMediaDevices({ getUserMedia });

  // Trap 3: canvas.toBlob gives a Blob; the component converts it to a File.
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ drawImage: vi.fn() }));
  HTMLCanvasElement.prototype.toBlob = vi.fn((callback) =>
    callback(new Blob(["photo-bytes"], { type: "image/png" }))
  );
  HTMLMediaElement.prototype.play = vi.fn(async () => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  defineMediaDevices(undefined);
});

const turnOn = () => screen.getByRole("button", { name: "Turn camera on" });
const stoppedTracks = (stream) => stream.tracks.every((track) => track.stop.mock.calls.length > 0);

describe("CameraCapture", () => {
  it("previews inside the page when the camera is turned on", async () => {
    render(<CameraCapture onPhoto={vi.fn()} />);

    await userEvent.click(turnOn());

    await waitFor(() => expect(document.querySelector("video")).toBeInTheDocument());
    expect(getUserMedia).toHaveBeenCalledWith({ video: { facingMode: "environment" } });
    expect(document.querySelector("video").srcObject).toBe(streams[0]);
  });

  it("offers take, switch and off once it is on", async () => {
    render(<CameraCapture onPhoto={vi.fn()} />);

    await userEvent.click(turnOn());

    await waitFor(() => expect(screen.getByRole("button", { name: "Take photo" })).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Switch camera" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Turn camera off" })).toBeInTheDocument();
  });

  it("hands back a File, not a Blob, and stops every track", async () => {
    const onPhoto = vi.fn();
    render(<CameraCapture onPhoto={onPhoto} />);

    await userEvent.click(turnOn());
    await waitFor(() => expect(screen.getByRole("button", { name: "Take photo" })).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: "Take photo" }));

    await waitFor(() => expect(onPhoto).toHaveBeenCalled());
    const file = onPhoto.mock.calls[0][0];
    expect(file).toBeInstanceOf(File);
    expect(file.type).toBe("image/png");
    expect(file.name).toBeTruthy();
    expect(stoppedTracks(streams[0])).toBe(true);
  });

  // FR-025, SC-008.
  it("stops every track when it unmounts", async () => {
    const { unmount } = render(<CameraCapture onPhoto={vi.fn()} />);

    await userEvent.click(turnOn());
    await waitFor(() => expect(screen.getByRole("button", { name: "Take photo" })).toBeInTheDocument());
    unmount();

    await waitFor(() => expect(stoppedTracks(streams[0])).toBe(true));
  });

  it("stops every track when the camera is turned off", async () => {
    render(<CameraCapture onPhoto={vi.fn()} />);

    await userEvent.click(turnOn());
    await waitFor(() => expect(screen.getByRole("button", { name: "Turn camera off" })).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: "Turn camera off" }));

    await waitFor(() => expect(stoppedTracks(streams[0])).toBe(true));
    expect(document.querySelector("video")).toBeNull();
    expect(turnOn()).toBeInTheDocument();
  });

  // FR-026.
  it("stops the previous stream's tracks before the new preview appears", async () => {
    render(<CameraCapture onPhoto={vi.fn()} />);

    await userEvent.click(turnOn());
    await waitFor(() => expect(screen.getByRole("button", { name: "Switch camera" })).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: "Switch camera" }));

    await waitFor(() => expect(streams).toHaveLength(2));
    expect(stoppedTracks(streams[0])).toBe(true);
    expect(stoppedTracks(streams[1])).toBe(false);
    expect(getUserMedia).toHaveBeenLastCalledWith({ video: { facingMode: "user" } });
    expect(document.querySelector("video").srcObject).toBe(streams[1]);
  });

  // FR-024: a denial is silent. The file picker is still there.
  it("renders no error text at all when getUserMedia is denied", async () => {
    getUserMedia.mockRejectedValue(new DOMException("Permission denied", "NotAllowedError"));
    render(<CameraCapture onPhoto={vi.fn()} />);

    await userEvent.click(turnOn());

    await waitFor(() => expect(getUserMedia).toHaveBeenCalled());
    expect(document.querySelector("video")).toBeNull();
    expect(screen.queryByText(/denied|error|failed|allow|permission|unavailable/i)).toBeNull();
  });

  it("renders no error text when mediaDevices is absent altogether", async () => {
    defineMediaDevices(undefined);
    render(<CameraCapture onPhoto={vi.fn()} />);

    await userEvent.click(turnOn());

    expect(document.querySelector("video")).toBeNull();
    expect(screen.queryByText(/denied|error|failed|allow|permission|unavailable/i)).toBeNull();
  });
});
