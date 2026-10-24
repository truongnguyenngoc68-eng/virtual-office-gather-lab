import React from 'react';

// --- BUTTON (Đã cập nhật Dark Mode) ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ElementType;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = "primary", 
  size = "md", 
  className = "", 
  icon: Icon, 
  ...props 
}) => {
  const baseStyle = "rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    // Primary: Giữ màu Teal, giảm bóng khi dark
    primary: "bg-teal-700 text-white hover:bg-teal-800 shadow-sm shadow-teal-200 dark:shadow-none dark:bg-teal-600 dark:hover:bg-teal-700",
    
    // Secondary: Nền xám nhạt -> Nền xám đậm
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
    
    // Outline: Viền xám -> Viền tối, Chữ tối -> Chữ sáng
    outline: "border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800",
    
    // Ghost: Hover nền sáng -> Hover nền tối
    ghost: "text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
    
    // Danger: Nền đỏ nhạt -> Nền đỏ trong suốt
    danger: "text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 18} />} 
      {children}
    </button>
  );
};

// --- AVATAR (Đã cập nhật Dark Mode) ---
interface AvatarProps { initials: string; status?: string; size?: "sm" | "md" | "lg"; className?: string; }
export const Avatar: React.FC<AvatarProps> = ({ initials, status, size = "md", className = "" }) => {
  const sizeClass = size === "lg" ? "w-12 h-12 text-lg" : size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  
  const statusColors: Record<string, string> = {
    Available: "bg-emerald-400", 
    Focusing: "bg-rose-400", 
    Meeting: "bg-amber-400", 
    Offline: "bg-slate-300", 
    Away: "bg-slate-400",
  };

  return (
    <div className={`relative ${className} shrink-0`}>
      {/* Circle chính: Thêm dark:bg và dark:text */}
      <div className={`${sizeClass} rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center border border-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-200 dark:border-indigo-700`}>
        {initials}
      </div>
      
      {/* Status Dot: Viền trắng (Light) -> Viền đen (Dark) để tiệp với nền */}
      {status && (
        <span 
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${statusColors[status] || "bg-slate-300"}`} 
            title={status} 
        />
      )}
    </div>
  );
};

// --- BADGE (Đã cập nhật Dark Mode) ---
export const Badge: React.FC<{ children: React.ReactNode; color?: "slate" | "teal" | "rose" | "indigo"; }> = ({ children, color = "slate" }) => {
  const colors = { 
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300", 
    teal: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300", 
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300", 
    indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" 
  };
  
  return <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${colors[color]}`}>{children}</span>;
};