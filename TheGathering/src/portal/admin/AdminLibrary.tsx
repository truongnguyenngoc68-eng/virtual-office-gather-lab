import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Search, Trash2, XCircle } from "lucide-react";
import { getServerUrl, getToken } from "../shared/storage";

type AdminResource = {
  _id: string;
  title: string;
  author?: string;
  content_type: string;
  url?: string;
  thumbnail_url?: string;
  isApproved: boolean;
  createdAt?: string;
};

export default function AdminLibrary() {
  const serverUrl = getServerUrl();
  const token = getToken();

  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<AdminResource[]>([]);
  const [q, setQ] = useState("");
  const [approved, setApproved] = useState<"all" | "true" | "false">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL(`${serverUrl}/api/admin/resources`);
      if (q.trim().length > 1) url.searchParams.set("q", q.trim());
      if (approved !== "all") url.searchParams.set("approved", approved);
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to load resources");
      setResources(Array.isArray(data.resources) ? data.resources : []);
    } catch (e) {
      console.error(e);
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [approved, q, serverUrl, token]);

  useEffect(() => {
    load();
  }, [load]);

  const setApproval = async (id: string, isApproved: boolean) => {
    try {
      const res = await fetch(
        `${serverUrl}/api/admin/resources/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isApproved }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed");
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const deleteResource = async (id: string, title: string) => {
    if (!confirm(`Xóa resource "${title}"?`)) return;
    try {
      const res = await fetch(
        `${serverUrl}/api/admin/resources/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed");
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-xl font-black text-slate-900">Library Management</h3>
          <div className="flex items-center gap-3">
            <select
              value={approved}
              onChange={(e) => setApproved(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm"
            >
              <option value="all">All</option>
              <option value="true">Approved</option>
              <option value="false">Pending</option>
            </select>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-full sm:w-72"
              />
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="p-6 text-slate-500">Loading...</div>
          ) : resources.length === 0 ? (
            <div className="p-6 text-slate-500">No resources.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map((r) => (
                <div
                  key={r._id}
                  className="p-5 rounded-3xl border border-slate-100 bg-white shadow-sm flex gap-4"
                >
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                    {r.thumbnail_url ? (
                      <img src={r.thumbnail_url} alt={r.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-400 font-black">
                        {r.title?.[0]?.toUpperCase() || "R"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-slate-900 truncate">
                      {r.title}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {r.author || "—"} • {r.content_type}
                    </div>
                    {r.url ? (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-600 font-bold hover:underline"
                      >
                        Open link
                      </a>
                    ) : null}
                    <div className="mt-3 flex items-center gap-2">
                      {r.isApproved ? (
                        <button
                          onClick={() => setApproval(r._id, false)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-amber-50 text-amber-700 font-black text-xs hover:bg-amber-100 transition"
                        >
                          <XCircle size={16} />
                          Unapprove
                        </button>
                      ) : (
                        <button
                          onClick={() => setApproval(r._id, true)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-teal-50 text-teal-700 font-black text-xs hover:bg-teal-100 transition"
                        >
                          <CheckCircle2 size={16} />
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => deleteResource(r._id, r.title)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-rose-50 text-rose-600 font-black text-xs hover:bg-rose-100 transition"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

