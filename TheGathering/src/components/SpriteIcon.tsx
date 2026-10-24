import React from 'react';

interface SpriteProps {
  src: string;
  size?: number; // Mặc định 64 (chuẩn LPC)
  x?: number;
  y?: number;
  scale?: number; // Phóng to để xem trong Editor
  style?: React.CSSProperties;
}

export default function SpriteIcon({ src, size = 64, x = 0, y = 0, scale = 1, style }: SpriteProps) {
  return (
    <div 
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: `url(${src})`,
        backgroundRepeat: 'no-repeat',
        // Kỹ thuật Sprite Sheet: Dịch chuyển ảnh để hiển thị đúng ô
        backgroundPosition: `-${x}px -${y}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left', // Cố định góc trái trên khi phóng to
        imageRendering: 'pixelated', // Giữ độ nét Pixel Art
        overflow: 'hidden',
       
        ...style
      }}
    />
  );
}