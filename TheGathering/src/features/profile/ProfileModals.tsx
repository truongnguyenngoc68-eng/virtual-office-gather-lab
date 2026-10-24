
import React, { useState } from 'react';
import { ASSETS, LAYER_ORDER } from '../../data/avatarAssets';
import SpriteIcon from '../../components/SpriteIcon';
import { FaPen, FaTimes } from 'react-icons/fa';

// User interface for profile modals
interface ProfileUser {
  displayName?: string;
  profileColor?: string;
  avatarConfig?: Record<string, string>;
}

// Avatar asset item interface
interface AvatarAssetItem {
  id: string;
  src?: string;
  x?: number;
  y?: number;
}

// --- 1. POPUP NHỎ (User Menu) ---
interface UserMenuProps {
  user: ProfileUser;
  onEditProfile: () => void;
  onLogout: () => void;
  onClose: () => void;
}

export const UserMenuPopup = ({ user, onEditProfile, onLogout, onClose }: UserMenuProps) => {
  return (
    <>
      {/* Overlay trong suốt để click ra ngoài thì đóng */}
      <div className="fixed inset-0 z-40" onClick={onClose}></div>

      <div className="absolute bottom-20 left-4 z-50 w-[300px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 animate-fade-in-up">
        <div className="flex items-center gap-4 mb-4">
            {/* Avatar tròn to */}
            <div 
              className="relative w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-md"
              style={{ backgroundColor: user.profileColor || '#87CEEB' }}
            >
                {user.displayName?.charAt(0).toUpperCase() || 'U'}
                {/* Dấu chấm xanh online */}
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" aria-label="Online status"></div>
            </div>
            
            <div>
                <h3 className="text-xl font-bold text-gray-800">{user.displayName}</h3>
                <p className="text-sm text-gray-500">Joined on Oct 15, 2025</p>
            </div>
        </div>

        <button 
            onClick={onEditProfile}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 mb-2"
        >
            Edit Profile
        </button>
        
        <button 
            onClick={onLogout}
            className="w-full py-2.5 text-gray-500 hover:bg-gray-50 rounded-xl font-medium transition-colors text-sm"
        >
            Đăng xuất
        </button>
      </div>
    </>
  );
};

// --- 2. MODAL LỚN (Edit Profile) ---
interface EditProfileProps {
  user: ProfileUser;
  onClose: () => void;
  onSave: (newName: string, newColor: string) => void;
  onEditAvatar: () => void; // Hàm callback để mở lại trang AvatarSelection
}

export const EditProfileModal = ({ user, onClose, onSave, onEditAvatar }: EditProfileProps) => {
  const [name, setName] = useState(user.displayName || '');
  const [color, setColor] = useState(user.profileColor || '#87CEEB');

  // Danh sách màu Profile Picture
  const colors = ['#87CEEB', '#FFB7B2', '#B5EAD7', '#E2F0CB', '#FFDAC1', '#E0BBE4', '#957DAD'];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative animate-scale-up">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Edit Profile</h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close edit profile modal"
              title="Close"
            >
              <FaTimes size={20}/>
            </button>
        </div>

        {/* Hai vòng tròn: Profile Picture & Avatar */}
        <div className="flex justify-center gap-10 mb-8">
            
            {/* Cột 1: Profile Picture (Chữ cái) */}
            <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Profile picture</span>
                <div className="relative group cursor-pointer">
                    <div 
                      className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-inner transition-colors"
                      style={{ backgroundColor: color }}
                    >
                        {name?.charAt(0).toUpperCase()}
                    </div>
                    {/* Nút bút chì nhỏ */}
                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow border border-gray-200 flex items-center justify-center text-gray-600">
                        <FaPen size={12} />
                    </div>
                    
                    {/* Color Picker đơn giản hiện khi hover */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white p-2 rounded-xl shadow-xl border border-gray-100 hidden group-hover:flex gap-1 z-10 w-max">
                        {colors.map(c => (
                            <button
                              key={c} 
                              onClick={() => setColor(c)} 
                              className="w-5 h-5 rounded-full cursor-pointer border border-gray-200" 
                              style={{ backgroundColor: c }}
                              aria-label={`Select color ${c}`}
                              title={c}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Cột 2: Avatar (Pixel Art) */}
            <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Avatar</span>
                <div className="relative cursor-pointer group" onClick={onEditAvatar}>
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shadow-inner relative">
                        {/* Render lại Avatar nhỏ ở đây */}
                        <div className="absolute inset-0 scale-[1.5] translate-y-4">
                             {/* Render Pixel Art Layers */}
                             {LAYER_ORDER.map(layerKey => {
                                const itemId = user.avatarConfig?.[layerKey];
                                const itemData = ASSETS[layerKey]?.find((i: AvatarAssetItem) => i.id === itemId);
                                if (itemData?.src) {
                                    return (
                                        <div key={layerKey} className="absolute inset-0 w-full h-full">
                                            <SpriteIcon src={itemData.src} x={itemData.x||0} y={itemData.y||0} size={64} />
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </div>
                    {/* Nút bút chì nhỏ */}
                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow border border-gray-200 flex items-center justify-center text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <FaPen size={12} />
                    </div>
                </div>
            </div>
        </div>

        {/* Input Full Name */}
        <div className="mb-8">
            <label htmlFor="profile-full-name" className="block text-sm font-bold text-gray-700 mb-2">
              Full name<span className="text-blue-500">*</span>
            </label>
            <input 
                id="profile-full-name"
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-gray-800 font-medium transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                aria-label="Full name"
                aria-required="true"
            />
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end pt-4 border-t border-gray-100">
             <button 
                onClick={() => onSave(name || '', color)}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
                disabled={!name?.trim()}
             >
                Save
             </button>
        </div>

      </div>
    </div>
  );
};