import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { formatRelativeTime } from "../../utils/date";

interface SearchResult {
  type: "user";
  id: string;
  title: string;
  content?: string;
  author?: string;
  createdAt: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
  channelId?: string;
  onMessageClick?: (messageId: string) => void;
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["user"]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5001";

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, selectedTypes]);

  const performSearch = async () => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const typesParam = selectedTypes.join(",");
      const response = await fetch(
        `${serverUrl}/api/search?q=${encodeURIComponent(
          query
        )}&types=${typesParam}&limit=20`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error("Error performing search:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === "user") {
      navigate(`/app/profile/${result.id}`);
      onClose();
    }
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const getResultIcon = (type: string) => {
    if (type === "user") return "👤";
    return "🔍";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-1000 pt-[10vh] animate-[fadeIn_0.2s_ease] backdrop-blur-sm" onClick={onClose}>
      <div className="w-[90%] max-w-[640px] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[80vh] animate-[slideDown_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-800 flex gap-3 items-center">
          <div className="flex-1 relative flex items-center gap-3">
            <span className="text-lg text-slate-400">🔍</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
            {query && (
              <button
                className="absolute right-2 bg-transparent border-none text-slate-400 cursor-pointer p-1 text-sm flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 hover:bg-slate-800 hover:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-600"
                onClick={() => setQuery("")}
                title="Clear"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <button className="bg-transparent border-none text-slate-400 cursor-pointer p-2 text-lg w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 hover:bg-slate-800 hover:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-600" onClick={onClose} title="Close (Esc)" aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-[#202225] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb:hover]:bg-[#1a1c1f]">
          {loading ? (
            <div className="py-12 px-5 text-center text-slate-400 text-sm">
              <div className="inline-block w-5 h-5 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin mb-2"></div>
              <p>Searching...</p>
            </div>
          ) : results.length === 0 && query.length >= 2 ? (
            <div className="py-12 px-5 text-center text-slate-400 text-sm">
              <div className="text-4xl mb-3 opacity-50">🔍</div>
              <p>No results found</p>
            </div>
          ) : query.length < 2 ? (
            <div className="py-12 px-5 text-center text-slate-400 text-sm">
              <div className="text-4xl mb-3 opacity-50">✨</div>
              <p>Type at least 2 characters to search</p>
            </div>
          ) : (
            results.map((result, index) => (
              <div
                key={`${result.type}-${result.id}-${index}`}
                className="flex gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 border-b border-slate-800 hover:bg-slate-900 last:border-b-0"
                onClick={() => handleResultClick(result)}
              >
                <div className="text-xl shrink-0 w-8 h-8 flex items-center justify-center">{getResultIcon(result.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-100 mb-1 leading-relaxed">{result.title}</div>
                  {result.content && (
                    <div className="text-xs text-slate-400 mb-2 leading-relaxed line-clamp-2">{result.content}</div>
                  )}
                  <div className="flex gap-2 items-center text-xs text-slate-500">
                    {result.author && (
                      <span className="font-medium">{result.author}</span>
                    )}
                    <span className="uppercase tracking-wide px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">{result.type}</span>
                    <span>
                      {formatRelativeTime(result.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-900/50">
          <span className="text-xs text-slate-500">Press Esc to close</span>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
