import * as React from "react";
import { FaChevronDown } from "react-icons/fa";

export default function Header() {
  return (
    // Container Header: Absolute top, cao 16 (64px), nền trắng, shadow nhẹ
    <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-4 bg-white shadow-sm md:px-10">
      
      {/* 1. Logo bên trái */}
      <div className="cursor-pointer group">
        {/* Text Logo: Màu xanh thương hiệu, font đậm, to */}
        <span className="text-xl font-bold text-[#0E71EB] md:text-2xl">
          The Gathering
        </span>
      </div>

      {/* 2. Menu bên phải */}
      <div className="flex items-center gap-4 text-sm font-medium text-gray-500 md:gap-6">
        
        {/* Link Đăng ký: Ẩn trên mobile (max-md:hidden) */}
        <a 
          href="#" 
          className="transition-colors hover:text-[#0E71EB] max-md:hidden"
        >
          Mới biết đến The Gathering? 
          <span className="ml-1 font-bold text-[#0E71EB]"> Đăng ký miễn phí</span>
        </a>
        
        <a 
          href="#" 
          className="transition-colors hover:text-[#0E71EB]"
        >
          Hỗ trợ
        </a>
        
        {/* Dropdown Ngôn ngữ: Bo tròn, hover xám nhạt */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 transition-colors rounded-full cursor-pointer hover:bg-gray-100 hover:text-[#0E71EB]">
          <span>Tiếng Việt</span>
          <FaChevronDown className="text-xs" />
        </div>
      </div>
    </header>
  );
}