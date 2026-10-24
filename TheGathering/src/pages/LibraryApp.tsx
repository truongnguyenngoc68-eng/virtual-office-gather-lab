import { useEffect, useMemo, useState } from "react";
import { BookOpen, Search, Filter } from "lucide-react";

/**
 * Library view inside the main app shell (similar style to EventsPage).
 */
export default function LibraryApp() {
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState<
    Array<{
      _id: string;
      title: string;
      author?: string;
      content_type: string;
      thumbnail_url?: string;
      url?: string;
      description?: string;
    }>
  >([]);

  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5001";

  const filters = [
    { label: "All", value: "all" },
    { label: "Guides", value: "guide" },
    { label: "E‑books", value: "ebook" },
    { label: "Courses", value: "course" },
    { label: "Videos", value: "video" },
    { label: "Audio", value: "audio" },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resources.filter((r) => {
      const matchesType = activeType === "all" || r.content_type === activeType;
      if (!matchesType) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        String(r.author || "").toLowerCase().includes(q)
      );
    });
  }, [resources, search, activeType]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const url = new URL(`${serverUrl}/api/resources`);
        url.searchParams.set("approved", "true");
        const res = await fetch(url.toString());
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Failed to load resources");
        if (!cancelled)
          setResources(Array.isArray(data.resources) ? data.resources : []);
      } catch (e) {
        console.warn("Failed to load resources:", e);
        if (!cancelled) setResources([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serverUrl]);

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#0b1120] font-sans text-slate-100 overflow-hidden relative selection:bg-violet-500/30">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.18]">
        <div className="w-full h-full bg-[radial-gradient(circle_at_top,_#1f2937_0,_transparent_55%),radial-gradient(circle_at_bottom,_#0f172a_0,_transparent_55%)]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-obsidian-light/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center border border-emerald-500/20">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="text-lg font-black">Library</div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              Guides & resources
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64 max-md:hidden">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search library..."
              className="w-full pl-9 pr-3 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/60 focus:border-emerald-500/40"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto p-6">
        <div className="flex flex-col lg:flex-row gap-5 h-full">
          {/* Filters */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">
                <Filter className="w-3.5 h-3.5" />
                Filters
              </div>
              <div className="space-y-1.5">
                {filters.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setActiveType(f.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      activeType === f.value
                        ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40"
                        : "bg-transparent text-slate-300 border border-transparent hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Grid */}
          <section className="flex-1">
            {loading ? (
              <div className="p-10 rounded-3xl border border-white/10 bg-white/5 text-center">
                <p className="text-slate-300">Loading library...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-10 rounded-3xl border border-dashed border-white/15 bg-white/3 text-center">
                <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                  <BookOpen size={28} />
                </div>
                <div className="text-slate-50 font-black text-2xl tracking-tight">
                  No resources yet
                </div>
                <div className="text-slate-400 mt-2 text-sm max-w-md mx-auto">
                  Your admin can publish guides, books and courses here for your
                  team to discover.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((r) => (
                  <a
                    key={r._id}
                    href={r.url || "#"}
                    target={r.url ? "_blank" : undefined}
                    rel={r.url ? "noreferrer" : undefined}
                    className="group rounded-3xl border border-white/10 bg-white/5 overflow-hidden hover:bg-white/10 transition-colors"
                  >
                    <div className="h-32 bg-slate-900/60">
                      {r.thumbnail_url ? (
                        <img
                          src={r.thumbnail_url}
                          alt={r.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          <BookOpen size={26} />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
                        {r.content_type}
                      </div>
                      <div className="mt-1.5 text-sm font-semibold text-slate-50 line-clamp-2">
                        {r.title}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        {r.author || "—"}
                      </div>
                      {r.description && (
                        <p className="mt-2 text-[11px] text-slate-400 line-clamp-3">
                          {r.description}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

