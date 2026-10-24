import { X, LogOut } from "lucide-react";
import { clearAuthStorage, getStoredUser } from "../shared/storage";

interface PortalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
}

export default function PortalSettingsModal({
  isOpen,
  onClose,
  onLogout,
}: PortalSettingsModalProps) {
  const user = getStoredUser();

  if (!isOpen) return null;

  const handleLogout = () => {
    clearAuthStorage();
    onLogout?.();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close settings"
      />

      <div className="relative w-full max-w-lg rounded-[2rem] border border-slate-800 bg-slate-900 p-8 text-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-black tracking-tight">Settings</h3>
        <p className="mt-1 text-sm text-slate-400 font-medium">
          {user?.username ? `Signed in as ${user.username}` : "Account controls"}
        </p>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 font-black tracking-tight hover:bg-rose-700 active:scale-[0.99] transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

