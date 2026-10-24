import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Trash2, Shield, User } from "lucide-react";
import { getServerUrl, getToken } from "../shared/storage";

type AdminUser = {
  _id: string;
  username: string;
  email?: string;
  role?: string;
  status?: string;
  displayName?: string;
  lastSeen?: string;
  createdAt?: string;
};

export default function AdminUsers() {
  const serverUrl = getServerUrl();
  const token = getToken();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL(`${serverUrl}/api/admin/users`);
      if (q.trim().length > 1) url.searchParams.set("q", q.trim());
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to load users");
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (e) {
      console.error(e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [q, serverUrl, token]);

  useEffect(() => {
    load();
  }, [load]);

  const updateRole = async (userId: string, role: string) => {
    try {
      const res = await fetch(`${serverUrl}/api/admin/users/${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to update role");
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const deleteUser = async (userId: string, username: string) => {
    if (!confirm(`Xóa user "${username}"?`)) return;
    try {
      const res = await fetch(`${serverUrl}/api/admin/users/${encodeURIComponent(userId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to delete user");
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => String(u.role || "").toLowerCase() === "admin").length;
    return { total, admins };
  }, [users]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <User size={24} />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              Total Users
            </span>
          </div>
          <p className="text-4xl font-black text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
              <Shield size={24} />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              Admins
            </span>
          </div>
          <p className="text-4xl font-black text-slate-900">{stats.admins}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-xl font-black text-slate-900">User Management</h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by username/email..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-full sm:w-72"
            />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  User
                </th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Role
                </th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={3} className="px-8 py-4">
                      <div className="h-12 bg-slate-50 rounded-xl" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-10 text-center text-slate-400 font-bold">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-900">
                        {u.displayName || u.username}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {u.username} {u.email ? `• ${u.email}` : ""}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <select
                        value={String(u.role || "member")}
                        onChange={(e) => updateRole(u._id, e.target.value)}
                        className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm"
                      >
                        <option value="member">member</option>
                        <option value="moderator">moderator</option>
                        <option value="admin">admin</option>
                        <option value="guest">guest</option>
                      </select>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => deleteUser(u._id, u.username)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-50 text-rose-600 font-black text-sm hover:bg-rose-100 transition"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

