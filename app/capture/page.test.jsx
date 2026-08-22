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
