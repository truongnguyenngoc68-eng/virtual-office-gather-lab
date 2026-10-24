import { useMemo, useState } from "react";
import { Calendar, Plus } from "lucide-react";
import { useEvents } from "../contexts/EventContext";
import EventModal from "../components/modals/EventModal";

export default function EventsPage() {
  const { events, loading, fetchEvents } = useEvents();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const sorted = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [events]);

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#0b1120] font-sans text-slate-100 overflow-hidden relative selection:bg-violet-500/30">
      {/* Subtle pixel-art inspired background to echo Gather Town */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.18]">
        <div className="w-full h-full bg-[radial-gradient(circle_at_top,_#1f2937_0,_transparent_55%),radial-gradient(circle_at_bottom,_#0f172a_0,_transparent_55%)]" />
      </div>

      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-obsidian-light/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/15 text-violet-300 flex items-center justify-center border border-violet-500/20">
            <Calendar size={20} />
          </div>
          <div>
            <div className="text-lg font-black">Events</div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              Booking & reminders
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => fetchEvents()}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-bold"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setIsOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 transition text-sm font-black"
          >
            <Plus size={16} />
            New event
          </button>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-slate-400">Loading events...</div>
        ) : sorted.length === 0 ? (
          <div className="relative p-10 rounded-3xl border border-white/10 bg-white/5 text-center overflow-hidden shadow-[0_18px_45px_rgba(15,23,42,0.8)]">
            {/* Mini-map style illustration */}
            <div className="absolute inset-0 opacity-70">
              <div className="absolute inset-x-6 bottom-4 top-16 rounded-2xl bg-[linear-gradient(135deg,#22c55e33,#16a34a22),linear-gradient(45deg,#4ade8033,#22c55e11)]" />
              <div className="absolute left-8 top-10 w-24 h-16 rounded-md bg-[repeating-linear-gradient(90deg,#f97316,#f97316_4px,#ea580c_4px,#ea580c_8px)] opacity-90 shadow-lg" />
              <div className="absolute right-10 top-12 w-32 h-20 rounded-md bg-[repeating-linear-gradient(90deg,#38bdf8,#38bdf8_4px,#0ea5e9_4px,#0ea5e9_8px)] opacity-90 shadow-lg" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-10 w-36 h-3 rounded-full bg-emerald-500/70 shadow-[0_0_18px_rgba(16,185,129,0.8)]" />
              <div className="absolute inset-x-12 bottom-6 flex justify-between text-xs text-emerald-50/90 font-semibold">
                <span>Lobby</span>
                <span>Cafe</span>
                <span>Meeting</span>
              </div>
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 border border-white/10 text-[11px] uppercase tracking-[0.2em] text-slate-300 font-bold mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Space schedule
              </div>
              <div className="text-slate-50 font-black text-2xl tracking-tight">
                No events yet
              </div>
              <div className="text-slate-300 mt-2 text-sm max-w-md mx-auto">
                Map out your office life with standups, socials, and focus sessions —
                all appearing right inside your Gather-style space.
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setIsOpen(true);
                }}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-sm font-black shadow-[0_10px_25px_rgba(88,28,135,0.6)] transition-transform hover:-translate-y-0.5"
              >
                <Plus size={16} />
                Create your first event
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sorted.map((e: any) => (
              <button
                key={e.eventId}
                type="button"
                onClick={() => {
                  setSelected(e);
                  setIsOpen(true);
                }}
                className="text-left p-5 rounded-3xl border border-white/10 bg-white/3 hover:bg-white/6 transition"
              >
                <div className="text-xs text-violet-300 font-black uppercase tracking-widest">
                  {new Date(e.startTime).toLocaleString()}
                </div>
                <div className="mt-2 text-lg font-black text-white">{e.title}</div>
                <div className="mt-1 text-sm text-slate-400 line-clamp-2">
                  {e.description || "—"}
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  {e.location ? `📍 ${e.location}` : "📍 (no location)"} •{" "}
                  {(e.attendees?.length || 0)} attendees
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {isOpen && (
        <EventModal
          event={selected}
          onClose={() => {
            setIsOpen(false);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

