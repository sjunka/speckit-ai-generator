import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BLOB_URL, JOB_ID } from "@/test/fixtures.js";
import CapturePage from "./page.jsx";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@clerk/nextjs", () => ({
  UserButton: () => null,
  useUser: () => ({ user: { publicMetadata: {} } }),
}));

const photo = (name) => new File(["photo-bytes"], name, { type: "image/png" });
const fileInput = () => document.querySelector('input[type="file"]');
const generateButton = () => screen.getByRole("button", { name: /generat/i });

const respondWith = (...responses) => {
  const fetchMock = vi.fn();
  responses.forEach(({ status = 200, body = {} }) =>
    fetchMock.mockResolvedValueOnce({ ok: status < 400, status, json: async () => body })
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

beforeEach(() => {
  push.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Capture screen — camera and emotion controls", () => {
  it("posts emotion and optional level instead of a hint", async () => {
    const fetchMock = respondWith({ body: { imageUrl: BLOB_URL } });

    render(<CapturePage />);
    await userEvent.upload(fileInput(), photo("first.png"));
    await waitFor(() => expect(generateButton()).toBeEnabled());

    const emotionSelect = screen.getByRole("combobox", { name: /emotion/i });
    await userEvent.selectOptions(emotionSelect, "angry");
    const levelSelect = screen.getByRole("combobox", { name: /level/i });
    await userEvent.selectOptions(levelSelect, "very");

    await userEvent.click(generateButton());

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ photo: expect.any(String), emotion: "angry", level: "very" });
    expect(body.hint).toBeUndefined();
  });

  it("omits the level for happy and keeps the file picker usable while paused", async () => {
    const fetchMock = respondWith({ status: 503 });

    render(<CapturePage />);
    await userEvent.upload(fileInput(), photo("first.png"));
    await waitFor(() => expect(generateButton()).toBeEnabled());

    const emotionSelect = screen.getByRole("combobox", { name: /emotion/i });
    await userEvent.selectOptions(emotionSelect, "happy");
    await userEvent.click(generateButton());

    expect(await screen.findByText(/generation is currently paused/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ photo: expect.any(String), emotion: "happy" });
    expect(body.level).toBeUndefined();
    expect(fileInput()).toBeInTheDocument();
  });
});

describe("Capture screen — live preview", () => {
  it("shows the camera stream in the preview box after turning the camera on", async () => {
    const stop = vi.fn();
    const stream = { getTracks: () => [{ stop }] };
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(stream),
      },
      configurable: true,
    });

    render(<CapturePage />);
    await userEvent.click(screen.getByRole("button", { name: /turn camera on/i }));

    await waitFor(() => {
      const video = document.querySelector("video");
      expect(video).toBeInTheDocument();
      expect(video.srcObject).toBe(stream);
    });
  });
});

describe("Capture screen — generation", () => {
  const selectPhoto = async () => {
    render(<CapturePage />);
    await userEvent.upload(fileInput(), photo("first.png"));
    await waitFor(() => expect(generateButton()).toBeEnabled());
  };

  it("shows a progress state and then the generated image in place", async () => {
    let resolve;
    const pending = new Promise((r) => (resolve = r));
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(pending));

    await selectPhoto();
    await userEvent.click(generateButton());

    expect(screen.getByRole("button", { name: /generating/i })).toBeInTheDocument();

    resolve({ ok: true, status: 200, json: async () => ({ imageUrl: BLOB_URL }) });

    const generated = await screen.findByAltText(/generated/i);
    expect(generated).toHaveAttribute("src", BLOB_URL);
  });

  it("shows a plain message on failure, keeping the photo for a retry", async () => {
    respondWith({ status: 502 });

    await selectPhoto();
    await userEvent.click(generateButton());

    expect(await screen.findByText(/provider is down/i)).toBeInTheDocument();
    expect(screen.getByAltText(/selected/i)).toBeInTheDocument();
    expect(generateButton()).toBeEnabled();
  });

  it("renders the paused banner and disables generate on a 503, not an error", async () => {
    respondWith({ status: 503 });

    await selectPhoto();
    await userEvent.click(generateButton());

    expect(await screen.findByText(/generation is currently paused/i)).toBeInTheDocument();
    expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
    await waitFor(() => expect(generateButton()).toBeDisabled());
  });
});

describe("Capture screen — handoff to video", () => {
  it("hides the make-video control until an image exists", async () => {
    render(<CapturePage />);

    expect(screen.queryByRole("button", { name: /make video/i })).not.toBeInTheDocument();

    await userEvent.upload(fileInput(), photo("first.png"));
    await waitFor(() => expect(generateButton()).toBeEnabled());
    expect(screen.queryByRole("button", { name: /make video/i })).not.toBeInTheDocument();
  });

  it("starts a job and navigates to the result route for the returned id", async () => {
    const fetchMock = respondWith(
      { body: { imageUrl: BLOB_URL } },
      { body: { jobId: JOB_ID } }
    );

    render(<CapturePage />);
    await userEvent.upload(fileInput(), photo("first.png"));
    await waitFor(() => expect(generateButton()).toBeEnabled());
    await userEvent.click(generateButton());

    await userEvent.click(await screen.findByRole("button", { name: /make video/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith(`/result/${JOB_ID}`));
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ imageUrl: BLOB_URL });
  });
});
