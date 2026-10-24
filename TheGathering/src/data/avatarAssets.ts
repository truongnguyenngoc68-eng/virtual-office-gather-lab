// src/data/avatarAssets.ts

// --- 1. CẤU HÌNH KÍCH THƯỚC & TỌA ĐỘ (CHUẨN LPC) ---
const FRAME_WIDTH = 64;
const FRAME_HEIGHT = 64;

// Theo chuẩn LPC:
// Dòng 10 (index 10) thường là hành động "Walk Down" (Đi xuống).
// Khi đứng yên, nhân vật cũng quay mặt xuống dưới nên ta lấy frame đầu tiên của dòng này.
const IDLE_DOWN_Y = 10 * 64; // 640px
const IDLE_DOWN_X = 0 * 64;  // 0px

// --- 2. DANH MỤC HIỂN THỊ (SIDEBAR) ---
export const CATEGORIES = [
  { id: 'skin', label: 'Body', icon: '🎨' },     // Đổi label thành Body cho chuẩn
  { id: 'hair', label: 'Hair', icon: '💇' },
  { id: 'head', label: 'Head', icon: '🧔' },
  { id: 'top', label: 'Top', icon: '👕' },
  { id: 'bottom', label: 'Pants', icon: '👖' },
  { id: 'shoes', label: 'Shoes', icon: '👟' },
  { id: 'hat', label: 'Hat', icon: '🧢' },
  { id: 'glasses', label: 'Glasses', icon: '👓' },
  { id: 'other', label: 'Other', icon: '🎒' },
];

// --- 3. DỮ LIỆU TÀI NGUYÊN (ASSETS) ---
export const ASSETS: any = {
  // --- BẮT BUỘC PHẢI CÓ (Không có nút "None") ---
  skin: [
    { id: 'none', src: null, label: 'Nude' }, 
    { 
      id: 'skin_1', 
      src: '/assets/avatar/body/body_1.png', // Đảm bảo file này tồn tại
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
    { 
      id: 'skin_2', 
      src: '/assets/avatar/body/body_2.png', // Đảm bảo file này tồn tại
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
    { 
      id: 'skin_3', 
      src: '/assets/avatar/body/body_3.png', // Đảm bảo file này tồn tại
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
    { 
      id: 'skin_4', 
      src: '/assets/avatar/body/body_4.png', // Đảm bảo file này tồn tại
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
    { 
      id: 'skin_5', 
      src: '/assets/avatar/body/body_5.png', // Đảm bảo file này tồn tại
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
    { 
      id: 'skin_6', 
      src: '/assets/avatar/body/body_6.png', // Đảm bảo file này tồn tại
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
    // Sau này thêm skin_2, skin_3...
  ],
 head: [
    { 
      id: 'head_1', 
      src: '/assets/avatar/head/head_1.png', // Đảm bảo file này tồn tại
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
    { 
      id: 'head_2', 
      src: '/assets/avatar/head/head_2.png', // Đảm bảo file này tồn tại
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
    { 
      id: 'head_3', 
      src: '/assets/avatar/head/head_3.png', // Đảm bảo file này tồn tại
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
    { 
      id: 'head_4', 
      src: '/assets/avatar/head/head_4.png', // Đảm bảo file này tồn tại
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
    { 
      id: 'head_5', 
      src: '/assets/avatar/head/head_5.png', // Đảm bảo file này tồn tại
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
    { 
      id: 'head_6', 
      src: '/assets/avatar/head/head_6.png', // Đảm bảo file này tồn tại
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
  ],
  // --- CÁC MỤC CÓ THỂ BỎ TRỐNG ("None") ---
  hair: [
    { id: 'none', src: null, label: 'Bald' }, // Tùy chọn hói
    { 
      id: 'hair_1', 
      src: '/assets/avatar/hair/hair_1.png', 
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
    { 
      id: 'hair_2', 
      src: '/assets/avatar/hair/hair_2.png', 
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
    { 
      id: 'hair_3', 
      src: '/assets/avatar/hair/hair_3.png', 
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
    { 
      id: 'hair_4', 
      src: '/assets/avatar/hair/hair_4.png', 
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
     { 
      id: 'hair_5', 
      src: '/assets/avatar/hair/hair_5.png', 
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
     { 
      id: 'hair_6', 
      src: '/assets/avatar/hair/hair_6.png', 
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
     { 
      id: 'hair_7', 
      src: '/assets/avatar/hair/hair_7.png', 
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
  ],

  top: [
    { id: 'none', src: null, label: 'Bare' }, // Cởi trần
    { 
      id: 'top_1', 
      src: '/assets/avatar/top/top_1.png', 
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
       { 
      id: 'top_2', 
      src: '/assets/avatar/top/top_2.png', 
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
       { 
      id: 'top_3', 
      src: '/assets/avatar/top/top_3.png', 
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
       { 
      id: 'top_4', 
      src: '/assets/avatar/top/top_4.png', 
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
       { 
      id: 'top_5', 
      src: '/assets/avatar/top/top_5.png', 
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
       { 
      id: 'top_6', 
      src: '/assets/avatar/top/top_6.png', 
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
       { 
      id: 'top_7', 
      src: '/assets/avatar/top/top_7.png', 
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
       { 
      id: 'top_8', 
      src: '/assets/avatar/top/top_8.png', 
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
       { 
      id: 'top_9', 
      src: '/assets/avatar/top/top_9.png', 
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
  ],

  bottom: [
    { id: 'none', src: null, label: 'Underwear' },
    { 
      id: 'pants_1', 
      src: '/assets/avatar/bottom/pants_1.png', 
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
    { 
      id: 'pants_2', 
      src: '/assets/avatar/bottom/pants_2.png', 
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
    { 
      id: 'pants_3', 
      src: '/assets/avatar/bottom/pants_3.png', 
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
    { 
      id: 'pants_4', 
      src: '/assets/avatar/bottom/pants_4.png', 
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
    { 
      id: 'pants_5', 
      src: '/assets/avatar/bottom/pants_5.png', 
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
    { 
      id: 'pants_6', 
      src: '/assets/avatar/bottom/pants_6.png', 
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
    { 
      id: 'pants_7', 
      src: '/assets/avatar/bottom/pants_7.png', 
      x: IDLE_DOWN_X, 
      y: IDLE_DOWN_Y 
    },
  ],

  // --- CÁC MỤC CHƯA CÓ ẢNH (Placeholder để không bị lỗi code) ---
  shoes: [
    { id: 'none', src: null, label: 'No Shoes' },
    { id: 'shoe_1', src: '/assets/avatar/shoes/shoes_1.png', x: 0, y: 640 },
    { id: 'shoe_2', src: '/assets/avatar/shoes/shoes_2.png', x: 0, y: 640 },
    { id: 'shoe_3', src: '/assets/avatar/shoes/shoes_3.png', x: 0, y: 640 },
    { id: 'shoe_4', src: '/assets/avatar/shoes/shoes_4.png', x: 0, y: 640 }
  ],
  hat: [
    { id: 'none', src: null, label: 'No Hat' },
    { id: 'hat_1', src: '/assets/avatar/hat/hat_1.png', x: 0, y: 640 },
    { id: 'hat_2', src: '/assets/avatar/hat/hat_2.png', x: 0, y: 640 },
    { id: 'hat_3', src: '/assets/avatar/hat/hat_3.png', x: 0, y: 640 },
    { id: 'hat_4', src: '/assets/avatar/hat/hat_4.png', x: 0, y: 640 }
  ],
  glasses: [
    { id: 'none', src: null, label: 'No Glasses' },
    { id: 'glasses_1', src: '/assets/avatar/glasses/glasses_1.png', x: 0, y: 640 },
    { id: 'glasses_2', src: '/assets/avatar/glasses/glasses_2.png', x: 0, y: 640 },
    { id: 'glasses_3', src: '/assets/avatar/glasses/glasses_3.png', x: 0, y: 640 },
    { id: 'glasses_4', src: '/assets/avatar/glasses/glasses_4.png', x: 0, y: 640 }
  ],
  facial: [
    { id: 'none', src: null, label: 'No Beard' },
  ],
  other: [
    { id: 'none', src: null, label: 'Empty' },
    { id: 'other_1', src: '/assets/avatar/other/other_1.png', x: 0, y: 640 },
    { id: 'other_2', src: '/assets/avatar/other/other_2.png', x: 0, y: 640 },
    { id: 'other_3', src: '/assets/avatar/other/other_3.png', x: 0, y: 640 },
    { id: 'other_4', src: '/assets/avatar/other/other_4.png', x: 0, y: 640 },
  ]
};

// --- 4. THỨ TỰ XẾP LỚP (Z-INDEX) ---
// Cái nào nằm đầu mảng sẽ vẽ trước (nằm dưới cùng)
export const LAYER_ORDER = [
  'other',
  'skin',     // 1. Cơ thể (Dưới cùng)
  'shoes',    // 2. Giày
  'bottom',   // 3. Quần (Che giày một chút)
  'top',      // 4. Áo (Che quần)
  'head',   // 5. Râu
  'hair',     // 6. Tóc
  'glasses',  // 7. Kính
  'hat'     // 8. Mũ (Che tóc)
       // 9. Balo/Phụ kiện (Trên cùng hoặc tùy loại)
];