import * as React from 'react';
import { CATEGORIES, ASSETS, LAYER_ORDER } from '../../data/avatarAssets';
import SpriteIcon from '../../components/SpriteIcon';
import { authFetch } from '../../utils/authFetch';

interface Props { token: string; onSuccess: () => void; }

// Màu giả lập cho Color Picker
const DEMO_COLORS = ['#FF5733', '#FFBD33', '#DBFF33', '#75FF33', '#33FF57', '#33FFBD', '#33DBFF', '#3357FF', '#7533FF', '#FF33BD'];

export default function AvatarSelection({ token, onSuccess }: Props) {
  const [avatarConfig, setAvatarConfig] = React.useState<any>({
    skin: ASSETS.skin?.[0]?.id || 'skin_1',
    hair: 'hair_1',
    top: 'shirt_1',
    bottom: 'pants_1',
  });

  const [displayName, setDisplayName] = React.useState('David Dat'); // Default demo name
  const [selectedCategory, setSelectedCategory] = React.useState('skin');
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5001';

  React.useEffect(() => {
    setErrorMsg(null);
    authFetch(`${serverUrl}/api/user/me`)
      .then(async (res) => {
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }
        if (!res.ok) throw new Error(`Load user failed (${res.status})`);
        return res.json();
      })
      .then(data => {
        if (data.displayName) setDisplayName(data.displayName);
        if (data.avatarConfig && Object.keys(data.avatarConfig).length > 0) {
          setAvatarConfig(data.avatarConfig);
        }
      })
      .catch(err => {
        console.error("Lỗi load user:", err);
        setErrorMsg(String(err?.message || err));
      });
  }, [token]);

  const handleSave = async () => {
    setErrorMsg(null);
    if (!displayName.trim()) {
      setErrorMsg("Vui lòng nhập tên hiển thị!");
      return;
    }
    
    if (loading) {
      console.log("Already saving, please wait...");
      return; // Prevent double click
    }
    
    setLoading(true);
    try {
      console.log("Saving avatar...", { displayName, avatarConfig });
      
      const res = await authFetch(`${serverUrl}/api/user/avatar`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
        },
        body: JSON.stringify({ displayName, avatarConfig })
      });
      
      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        setLoading(false);
        setErrorMsg("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        // Reload to let LegacyAuthFlow render login screen cleanly
        setTimeout(() => window.location.reload(), 300);
        return;
      }

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data?.message || `Lỗi khi lưu avatar (${res.status})`);
      }
      
      // Success - redirect to dashboard
      console.log("Avatar saved successfully:", data);
      // Persist latest profile to localStorage so next screen can render immediately
      try {
        const existing = JSON.parse(localStorage.getItem("user") || "{}");
        const merged = {
          ...existing,
          ...(data || {}),
          displayName,
          avatarConfig,
        };
        localStorage.setItem("user", JSON.stringify(merged));
        localStorage.setItem("userName", displayName);
        localStorage.setItem("userAvatar", (displayName?.[0] || "G").toUpperCase());
      } catch {
        // ignore
      }

      setLoading(false);
      onSuccess();
      
    } catch(err: any) { 
      console.error("Error saving avatar:", err);
      setErrorMsg(err?.message || "Lỗi lưu avatar. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  return (
    <div className="avatar-editor-container">
      
      {/* --- CỘT 1: SIDEBAR --- */}
      <div className="editor-sidebar">
        <h2 className="text-xl font-bold px-4 mb-4 mt-2 text-gray-800">Edit Avatar</h2>
        {CATEGORIES.map(cat => (
          <div 
            key={cat.id} 
            className={`sidebar-item ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {/* Vòng tròn icon */}
            <div className="sidebar-icon">
                {cat.icon}
            </div>
            <span>{cat.label}</span>
          </div>
        ))}
      </div>

      {/* --- CỘT 2: MAIN (GRID) --- */}
      <div className="editor-main">
        {/* Hộp xám chứa Grid */}
        <div className="assets-container">
            <div className="item-grid">
            {ASSETS[selectedCategory]?.map((item: any) => {
                const isSelected = avatarConfig[selectedCategory] === item.id;
                return (
                <div 
                    key={item.id}
                    className={`grid-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setAvatarConfig({ ...avatarConfig, [selectedCategory]: item.id })}
                >
                    {item.src ? (
                        <SpriteIcon 
                            src={item.src} 
                            x={item.x || 0} 
                            y={item.y || 0} 
                            scale={1} // To hơn chút để dễ nhìn
                        />
                    ) : (
                        // Fallback nếu không có ảnh (ví dụ màu skin)
                        <div className="w-10 h-10 rounded-full" style={{backgroundColor: item.color || '#ccc'}}></div>
                    )}
                </div>
                );
            })}
            </div>
        </div>

        {/* Color Picker Section (Giả lập giống mẫu) */}
        <div className="color-picker-section">
            {DEMO_COLORS.map(color => (
                <div key={color} className="color-circle" style={{backgroundColor: color}}></div>
            ))}
        </div>
      </div>

      {/* --- CỘT 3: PREVIEW --- */}
      <div className="editor-preview">
        {/* Pattern nền */}
        <div className="preview-bg-pattern"></div>

        {/* Input Tên (Nổi ở trên) */}
        <div className="name-input-container">
             <input 
                className="name-input"
                value={displayName} 
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Tên nhân vật..."
             />
        </div>

        {/* Nhân vật trung tâm */}
        <div className="avatar-stage">
            {/* Name Tag trên đầu nhân vật */}
            <div className="name-tag">
                <span className="w-2 h-2 bg-green-500 rounded-full inline-block mr-1"></span>
                {displayName || 'Player'}
            </div>

            {/* Các lớp sprite */}
            <div className="relative w-[64px] h-[64px]">
                {LAYER_ORDER.map(layerKey => {
                    const itemId = avatarConfig[layerKey];
                    const itemData = ASSETS[layerKey]?.find((i:any) => i.id === itemId);
                    if (itemData?.src) {
                        return (
                            <div key={layerKey} className="absolute inset-0 w-full h-full pointer-events-none">
                                <SpriteIcon 
                                    src={itemData.src} 
                                    x={itemData.x || 0} 
                                    y={itemData.y || 0} 
                                    size={64} 
                                />
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        </div>

        {/* Footer Buttons */}
        <div className="preview-footer">
            <button 
                className="btn-cancel" 
                onClick={() => window.location.reload()}
                disabled={loading}
            >
                Cancel
            </button>
            <button 
                className="btn-save" 
                onClick={handleSave} 
                disabled={loading}
                style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
            >
                {loading ? 'Saving...' : 'Done'}
            </button>
        </div>
        {errorMsg && (
          <div className="mt-3 text-sm text-red-600 text-center px-4">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}