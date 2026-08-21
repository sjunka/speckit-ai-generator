import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { VIDEO_URL, JOB_ID } from "@/test/fixtures.js";
import ResultPage from "./page.jsx";

vi.mock("next/navigation", () => ({ useParams: () => ({ jobId: JOB_ID }) }));

// The screen talks to the API over fetch only; every test drives it from here.
const respond = (...responses) => {
  const fetchMock = vi.fn();
  responses.forEach((body) =>
    fetchMock.mockResolvedValueOnce(
      body === 404
        ? { ok: false, status: 404, json: async () => ({}) }
        : { ok: true, status: 200, json: async () => body }
    )
  );
  // Keep answering with the last response once the queue runs out.
  fetchMock.mockResolvedValue(
    responses.at(-1) === 404
      ? { ok: false, status: 404, json: async () => ({}) }
      : { ok: true, status: 200, json: async () => responses.at(-1) }
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

// Timer-driven tests opt into fake timers themselves — Testing Library's
// waitFor needs the real ones, so the two never share a test.
const tick = (ms) => act(() => vi.advanceTimersByTimeAsync(ms));

beforeEach(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Result screen — waiting for the render", () => {
  it("shows a progress indicator and 'Rendering your video' while pending", async () => {
    respond({ status: "pending" });
    render(<ResultPage />);

    expect(await screen.findByText(/Rendering your video/)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("requests the status again three seconds after each response", async () => {
    const fetchMock = respond({ status: "pending" });
    vi.useFakeTimers();
    render(<ResultPage />);

    await tick(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await tick(2999);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await tick(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("stops polling once the job is ready", async () => {
    const fetchMock = respond({ status: "ready", videoUrl: VIDEO_URL });
    vi.useFakeTimers();
    render(<ResultPage />);

    await tick(0);
    expect(screen.getByTestId("video-player")).toBeInTheDocument();

    await tick(10000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stops polling once the job has failed", async () => {
    const fetchMock = respond({ status: "failed" });
    vi.useFakeTimers();
    render(<ResultPage />);

    await tick(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await tick(10000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stops polling when the screen unmounts", async () => {
    const fetchMock = respond({ status: "pending" });
    vi.useFakeTimers();
    const { unmount } = render(<ResultPage />);

    await tick(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    unmount();

    await tick(10000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("Result screen — playback", () => {
  it("renders a player with controls that plays inline against the returned url", async () => {
    respond({ status: "ready", videoUrl: VIDEO_URL });
    render(<ResultPage />);

    const player = await screen.findByTestId("video-player");
    expect(player).toHaveAttribute("src", VIDEO_URL);
    expect(player).toHaveAttribute("controls");
    expect(player).toHaveAttribute("playsinline");
  });
});

describe("Result screen — failures", () => {
  it("shows a plain message and a link back to capture for a failed job, with no player", async () => {
    respond({ status: "failed" });
    render(<ResultPage />);

    expect(await screen.findByText(/render failed/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to capture/i })).toHaveAttribute(
      "href",
      "/capture"
    );
    expect(screen.queryByTestId("video-player")).not.toBeInTheDocument();
  });

  it("shows a not-found message and the same link for an unknown job id", async () => {
    respond(404);
    render(<ResultPage />);

    expect(await screen.findByText(/could not find that video/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to capture/i })).toHaveAttribute(
      "href",
      "/capture"
    );
    expect(screen.queryByTestId("video-player")).not.toBeInTheDocument();
  });
});

describe("Result screen — download and share", () => {
  it("offers a download control that saves the file directly", async () => {
    respond({ status: "ready", videoUrl: VIDEO_URL });
    render(<ResultPage />);

    const download = await screen.findByRole("link", { name: /download/i });
    expect(download).toHaveAttribute("href", VIDEO_URL);
    expect(download).toHaveAttribute("download");
  });

  it("opens the native share sheet with the video as a file when sharing is supported", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "canShare", { value: () => true, configurable: true });
    Object.defineProperty(navigator, "share", { value: share, configurable: true });

    const fetchMock = respond({ status: "ready", videoUrl: VIDEO_URL });
    fetchMock.mockResolvedValue({ ok: true, status: 200, blob: async () => new Blob(["video"]) });

    render(<ResultPage />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /share/i }));

    await waitFor(() => expect(share).toHaveBeenCalled());
    const payload = share.mock.calls[0][0];
    expect(payload.title).toBeTruthy();
    expect(payload.files[0]).toBeInstanceOf(File);

    delete navigator.canShare;
    delete navigator.share;
  });

  it("hides the share control where sharing is unsupported, keeping download", async () => {
    respond({ status: "ready", videoUrl: VIDEO_URL });
    render(<ResultPage />);

    await screen.findByRole("link", { name: /download/i });
    expect(screen.queryByRole("button", { name: /share/i })).not.toBeInTheDocument();
  });
});
