import { auth } from "@clerk/nextjs/server";
import { getSettings } from "@/lib/settings.js";
import { Nav } from "@/components/Nav";
import { db } from "@/lib/db.js";
import { COST_PER_IMAGE, COST_PER_VIDEO } from "@/lib/models.js";
import { SettingsPanel } from "@/components/dashboard/SettingsPanel";

const notFound = () => (
  <div className="flex min-h-screen items-center justify-center bg-canvas">
    <div className="text-center">
      <h1 className="display-xl text-ink mb-4">404</h1>
      <p className="body text-ink-subtle">Not found</p>
    </div>
  </div>
);

const StatCard = ({ label, value }) => (
  <div className="bg-surface-1 border border-hairline rounded-lg p-6">
    <p className="eyebrow text-ink-subtle mb-2">{label}</p>
    <p className="display-md text-ink">{value}</p>
  </div>
);

export default async function DashboardPage() {
  const { userId, sessionClaims } = await auth();

  if (!userId || sessionClaims?.publicMetadata?.role !== "admin") return notFound();

  const [settings, database] = await Promise.all([getSettings(), db()]);
  const generations = database.db("ia-generator").collection("generations");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [totalImages, totalVideos, generationsToday] = await Promise.all([
    generations.countDocuments({ kind: "image" }),
    generations.countDocuments({ kind: "video" }),
    generations.countDocuments({ timestamp: { $gte: today } }),
  ]);
  const estimatedSpend = (totalImages * COST_PER_IMAGE + totalVideos * COST_PER_VIDEO).toFixed(2);

  return (
    <div className="min-h-screen bg-canvas text-ink p-4 md:p-8">
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-8"><Nav /></div>
        <div className="mb-8">
          <h1 className="display-sm mb-2">Settings</h1>
          <p className="body text-ink-subtle">Monitor generation usage and spend</p>
        </div>
        <div className="space-y-6">
          <SettingsPanel initial={settings} />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <StatCard label="IMAGES" value={totalImages} />
            <StatCard label="VIDEOS" value={totalVideos} />
            <StatCard label="TODAY" value={generationsToday} />
          </div>
          <div className="bg-surface-2 border border-hairline-strong rounded-lg p-6">
            <p className="eyebrow text-ink-subtle mb-2">ESTIMATED MONTHLY SPEND</p>
            <p className="display-xl text-ink">${estimatedSpend}</p>
            <p className="body-sm text-ink-subtle mt-2">This is an estimate based on current generation rates.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
