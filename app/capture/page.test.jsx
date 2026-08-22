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

describe("Capture screen — photo capture", () => {
  it("uses one file input that opens the rear camera on mobile and an image picker on desktop", () => {
    render(<CapturePage />);

    expect(document.querySelectorAll('input[type="file"]')).toHaveLength(1);
    expect(fileInput()).toHaveAttribute("accept", "image/*");
    expect(fileInput()).toHaveAttribute("capture", "environment");
  });

  it("shows a preview once a photo is selected", async () => {
    render(<CapturePage />);

    await userEvent.upload(fileInput(), photo("first.png"));

    const preview = await screen.findByAltText(/selected/i);
    expect(preview).toBeInTheDocument();
  });

  it("updates the preview when a second photo replaces the first", async () => {
    render(<CapturePage />);

    await userEvent.upload(fileInput(), photo("first.png"));
    const first = (await screen.findByAltText(/selected/i)).getAttribute("src");

    await userEvent.upload(fileInput(), new File(["other-bytes"], "second.png", {
      type: "image/png",
    }));

    await waitFor(() =>
      expect(screen.getByAltText(/selected/i).getAttribute("src")).not.toBe(first)
    );
    expect(screen.getAllByAltText(/selected/i)).toHaveLength(1);
  });

  it("disables generate until a photo is selected", async () => {
    render(<CapturePage />);

    expect(generateButton()).toBeDisabled();

    await userEvent.upload(fileInput(), photo("first.png"));
    await waitFor(() => expect(generateButton()).toBeEnabled());
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

  it("posts the emotion and no level for happy, and no hint at all", async () => {
    const fetchMock = respondWith({ body: { imageUrl: BLOB_URL } });

    await selectPhoto();
    await userEvent.click(generateButton());

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.emotion).toBe("happy");
    expect(body).not.toHaveProperty("level");
    expect(body).not.toHaveProperty("hint");
    expect(body.photo).toBeTruthy();
  });

  it("posts the emotion and the level for an emotion that takes one", async () => {
    const fetchMock = respondWith({ body: { imageUrl: BLOB_URL } });

    await selectPhoto();
    await userEvent.selectOptions(screen.getByLabelText("Emotion"), "angry");
    await userEvent.selectOptions(screen.getByLabelText("Level"), "very");
    await userEvent.click(generateButton());

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ emotion: "angry", level: "very" });
    expect(body).not.toHaveProperty("hint");
  });

  it("drops the level again when the reader goes back to happy", async () => {
    const fetchMock = respondWith({ body: { imageUrl: BLOB_URL } });

    await selectPhoto();
    await userEvent.selectOptions(screen.getByLabelText("Emotion"), "sad");
    await userEvent.selectOptions(screen.getByLabelText("Emotion"), "happy");
    await userEvent.click(generateButton());

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ emotion: "happy" });
    expect(body).not.toHaveProperty("level");
  });

  it("offers the three emotions and none of the ten withdrawn moods", async () => {
    render(<CapturePage />);

    const options = [...screen.getByLabelText("Emotion").options].map((option) => option.value);
    expect(options).toEqual(["happy", "angry", "sad"]);
    expect(screen.queryByLabelText("Mood")).toBeNull();
    expect(screen.queryByText(/I am feeling/)).toBeNull();
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

// T018 — the in-page camera, wired to the same handler the file picker uses.
describe("Capture screen — the in-page camera", () => {
  let streams;

  const fakeStream = () => {
    const stream = { tracks: [{ stop: vi.fn() }] };
    stream.getTracks = () => stream.tracks;
    streams.push(stream);
    return stream;
  };

  beforeEach(() => {
    streams = [];
    // Trap 1: the property is absent in jsdom, so it is defined rather than set.
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn(async () => fakeStream()) },
      configurable: true,
      writable: true,
    });
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ drawImage: vi.fn() }));
    HTMLCanvasElement.prototype.toBlob = vi.fn((callback) =>
      callback(new Blob(["camera-bytes"], { type: "image/png" }))
    );
  });

  const takeFromCamera = async () => {
    await userEvent.click(screen.getByRole("button", { name: "Turn camera on" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Take photo" })).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: "Take photo" }));
  };

  // FR-022: a taken photo is indistinguishable from a picked file.
  it("previews a taken photo and enables Generate exactly as a picked file does", async () => {
    render(<CapturePage />);

    expect(generateButton()).toBeDisabled();
    await takeFromCamera();

    expect(await screen.findByAltText(/selected/i)).toBeInTheDocument();
    await waitFor(() => expect(generateButton()).toBeEnabled());
  });

  it("sends the taken photo as the photo in the request", async () => {
    const fetchMock = respondWith({ body: { imageUrl: BLOB_URL } });

    render(<CapturePage />);
    await takeFromCamera();
    await waitFor(() => expect(generateButton()).toBeEnabled());
    await userEvent.click(generateButton());

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.photo).toContain("data:image/png");
    expect(body.emotion).toBe("happy");
  });

  // US4 scenario 9: picking a file afterwards replaces it, as in 001.
  it("lets a picked file replace a taken photo", async () => {
    render(<CapturePage />);

    await takeFromCamera();
    const taken = (await screen.findByAltText(/selected/i)).getAttribute("src");

    await userEvent.upload(fileInput(), new File(["picked-bytes"], "picked.png", { type: "image/png" }));

    await waitFor(() =>
      expect(screen.getByAltText(/selected/i).getAttribute("src")).not.toBe(taken)
    );
    expect(screen.getAllByAltText(/selected/i)).toHaveLength(1);
  });

  // FR-023: the file picker alone still completes a generation.
  it("still completes a generation from the file picker alone", async () => {
    const fetchMock = respondWith({ body: { imageUrl: BLOB_URL } });

    render(<CapturePage />);
    await userEvent.upload(fileInput(), photo("first.png"));
    await waitFor(() => expect(generateButton()).toBeEnabled());
    await userEvent.click(generateButton());

    expect(await screen.findByAltText(/generated/i)).toHaveAttribute("src", BLOB_URL);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

// T020 — FR-027, FR-028, SC-009: the camera is independent of generation.
describe("Capture screen — the camera while generation is paused", () => {
  let getUserMedia;

  beforeEach(() => {
    const stream = { tracks: [{ stop: vi.fn() }] };
    stream.getTracks = () => stream.tracks;
    getUserMedia = vi.fn(async () => stream);
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia },
      configurable: true,
      writable: true,
    });
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ drawImage: vi.fn() }));
    HTMLCanvasElement.prototype.toBlob = vi.fn((callback) =>
      callback(new Blob(["camera-bytes"], { type: "image/png" }))
    );
  });

  const pauseGeneration = async () => {
    const fetchMock = respondWith({ status: 503 });
    render(<CapturePage />);
    await userEvent.upload(fileInput(), photo("first.png"));
    await waitFor(() => expect(generateButton()).toBeEnabled());
    await userEvent.click(generateButton());
    expect(await screen.findByText(/generation is currently paused/i)).toBeInTheDocument();
    return fetchMock;
  };

  it("still renders the paused banner, unchanged from 001", async () => {
    await pauseGeneration();

    expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
    await waitFor(() => expect(generateButton()).toBeDisabled());
  });

  it("turns the camera on, takes a photo and leaves the network alone while paused", async () => {
    const fetchMock = await pauseGeneration();
    const callsBefore = fetchMock.mock.calls.length;

    await userEvent.click(screen.getByRole("button", { name: "Turn camera on" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Take photo" })).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: "Take photo" }));

    expect(getUserMedia).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByAltText(/selected/i)).toBeInTheDocument());
    expect(fetchMock.mock.calls).toHaveLength(callsBefore);
  });

  it("still accepts a picked file while paused", async () => {
    const fetchMock = await pauseGeneration();
    const callsBefore = fetchMock.mock.calls.length;
    const before = screen.getByAltText(/selected/i).getAttribute("src");

    expect(fileInput()).toBeEnabled();
    await userEvent.upload(fileInput(), new File(["other-bytes"], "second.png", { type: "image/png" }));

    await waitFor(() =>
      expect(screen.getByAltText(/selected/i).getAttribute("src")).not.toBe(before)
    );
    expect(fetchMock.mock.calls).toHaveLength(callsBefore);
  });
});

// T021 — FR-029 for the controls this feature adds.
describe("Capture screen — responsive and accessible", () => {
  beforeEach(() => {
    const stream = { tracks: [{ stop: vi.fn() }] };
    stream.getTracks = () => stream.tracks;
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn(async () => stream) },
      configurable: true,
      writable: true,
    });
  });

  it("widens the layout at md and lg", () => {
    render(<CapturePage />);

    expect(screen.getByRole("main")).toHaveClass("md:max-w-2xl", "lg:max-w-4xl");
  });

  it("fits 360px without a horizontal scroll", async () => {
    const { renderAt360px } = await import("@/test/viewport.js");

    const { container, cleanup } = renderAt360px(<CapturePage />);

    expect(container.scrollWidth).toBeLessThanOrEqual(360);
    cleanup();
  });

  it("gives the emotion and level selects 44px and a visible focus ring", async () => {
    render(<CapturePage />);

    expect(screen.getByLabelText("Emotion").className).toMatch(/h-11/);
    expect(screen.getByLabelText("Emotion").className).toMatch(/focus:outline/);

    await userEvent.selectOptions(screen.getByLabelText("Emotion"), "angry");
    expect(screen.getByLabelText("Level").className).toMatch(/h-11/);
    expect(screen.getByLabelText("Level").className).toMatch(/focus:outline/);
  });

  it("gives every camera control 44px and a visible focus ring", async () => {
    render(<CapturePage />);

    const onControl = screen.getByRole("button", { name: "Turn camera on" });
    expect(onControl.className).toMatch(/h-11/);
    expect(onControl.className).toMatch(/focus:outline/);

    await userEvent.click(onControl);
    await waitFor(() => expect(screen.getByRole("button", { name: "Take photo" })).toBeInTheDocument());

    ["Take photo", "Switch camera", "Turn camera off"].forEach((name) => {
      const control = screen.getByRole("button", { name });
      expect(control.className).toMatch(/h-11/);
      expect(control.className).toMatch(/focus:outline/);
    });
  });

  it("clears 4.5:1 for body text on every surface step", async () => {
    const { assertBodyTextContrast } = await import("@/test/contrast.js");

    assertBodyTextContrast();
  });

  it("uses no raw palette hex in the files this block owns", async () => {
    const { readFileSync } = await import("node:fs");

    ["app/capture/page.jsx", "components/capture/EmotionPicker.jsx", "components/capture/CameraCapture.jsx"].forEach(
      (file) => {
        expect(readFileSync(`${process.cwd()}/${file}`, "utf8")).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      }
    );
  });
});
