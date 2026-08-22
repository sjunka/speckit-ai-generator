import { auth } from "@clerk/nextjs/server";
import { getSettings } from "@/lib/settings.js";
import { Nav } from "@/components/Nav";
import { db } from "@/lib/db.js";
import { COST_PER_IMAGE, COST_PER_VIDEO } from "@/lib/models.js";
import { SettingsPanel } from "@/components/dashboard/SettingsPanel";

const notFound = () => (
  <div className="flex items-center justify-center min-h-screen bg-canvas">
    <div className="text-center">
      <h1 className="display-xl text-ink mb-4">404</h1>
      <p className="body text-ink-subtle">Not found</p>
    </div>
  </div>
);

const IconImage = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
    <rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="7" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2 14l4.5-4 3.5 3 3-2.5 4.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconVideo = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
    <rect x="2" y="4" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M14 8.5l4-2.3v7.6l-4-2.3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const IconCalendar = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
    <rect x="2.5" y="4" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2.5 8h15M6 2.5v3M14 2.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IconDollar = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
    <path d="M10 1v18M14 4H8.5a3 3 0 0 0 0 6h3a3 3 0 0 1 0 6H4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const StatCard = ({ icon, tint, label, value }) => (
  <div className="bg-surface-1 border border-hairline rounded-lg p-6">
    <div className={`w-11 h-11 rounded-md flex items-center justify-center mb-4 ${tint}`}>{icon}</div>
    <p className="eyebrow text-ink-subtle mb-2">{label}</p>
    <p className="display-md text-ink">{value}</p>
  </div>
);

export default async function DashboardPage() {
  const { userId, sessionClaims } = await auth();

  if (!userId || sessionClaims?.publicMetadata?.role !== "admin") {
    return notFound();
  }

  const [settings, database] = await Promise.all([getSettings(), db()]);
  const generations = database.collection("generations");

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
        <div className="mb-8">
          <Nav />
        </div>

        <div className="mb-8">
          <h1 className="display-sm mb-2">Settings</h1>
          <p className="body text-ink-subtle">Monitor generation usage and spend</p>
        </div>

        <div className="space-y-6">
          <SettingsPanel initial={settings} />

          {/* Counters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              icon={<IconImage />}
              tint="bg-primary/15 text-primary-light"
              label="IMAGES"
              value={totalImages}
            />
            <StatCard
              icon={<IconVideo />}
              tint="bg-primary/15 text-primary-light"
              label="VIDEOS"
              value={totalVideos}
            />
            <StatCard
              icon={<IconCalendar />}
              tint="bg-primary/15 text-primary-light"
              label="TODAY"
              value={generationsToday}
            />
          </div>

          {/* Estimated Spend */}
          <div className="bg-surface-2 border border-hairline-strong rounded-lg p-6">
            <div className="w-11 h-11 rounded-md flex items-center justify-center mb-4 bg-success/15 text-success">
              <IconDollar />
            </div>
            <p className="eyebrow text-ink-subtle mb-2">ESTIMATED MONTHLY SPEND</p>
            <p className="display-xl text-ink">${estimatedSpend}</p>
            <p className="text-xs text-ink-subtle mt-2">This is an estimate based on current generation rates.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
