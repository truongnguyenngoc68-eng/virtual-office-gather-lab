export interface AssetDefinition {
  key: string;
  path: string;
  type: 'furniture' | 'decoration' | 'character' | 'tile' | 'background' | 'item';
  interaction?: 'sit' | 'work' | 'meet' | 'dispense' | 'none'; // Định nghĩa hành động
  scale?: number; // Tùy chỉnh tỉ lệ nếu ảnh quá to/nhỏ
}

export const ASSETS = {
  // 1. Ảnh nền map lớn
  backgrounds: [
    { key: "bg_large_map", path: "/assets/backgrounds/large_map.png", type: "background" },
  ],

  // 2. Tilesets (Gạch lát sàn/tường dùng cho Tilemap)
  tilesets: [
    { key: "tiles_office", path: "/assets/tiles/office.png", type: "tile" },
  ],

  // 3. Nhân vật (Spritesheets)
  characters: [
    { key: "char_player", path: "/assets/characters/player.png", type: "character" },
    { key: "char_npc1", path: "/assets/characters/npc1.png", type: "character" },
    { key: "char_npc2", path: "/assets/characters/npc2.png", type: "character" },
    { key: "char_npcs_full", path: "/assets/characters/npcs.png", type: "character" }, // Nhiều NPC trong 1 ảnh
  ],

  // 4. Nội thất & Vật phẩm (Dựa trên folder /assets/objects của bạn)
  furniture: [
    // Bàn làm việc
    { 
      key: "desk_ornate", 
      path: "/assets/objects/Desk_Ornate.png", 
      type: "furniture", 
      interaction: "work" 
    },
    // Bàn họp
    { 
      key: "table_card", 
      path: "/assets/objects/Card_Table.png", 
      type: "furniture", 
      interaction: "meet" 
    },
    // Đồ điện tử & Công việc
    { 
      key: "laptop", 
      path: "/assets/objects/Laptop.png", 
      type: "item", 
      scale: 0.8 
    },
    { 
      key: "copy_machine", 
      path: "/assets/objects/Copy_Machine.png", 
      type: "furniture",
      interaction: "work"
    },
    { 
      key: "tv_widescreen", 
      path: "/assets/objects/TV_Widescreen.png", 
      type: "furniture" 
    },
    { 
      key: "rotary_phone", 
      path: "/assets/objects/Rotary_Phones.png", 
      type: "item" 
    },
    
    // Khu vực Break room / Ăn uống
    { 
      key: "water_cooler", 
      path: "/assets/objects/Water_Cooler.png", 
      type: "furniture",
      interaction: "dispense"
    },
    { 
      key: "coffee_maker", 
      path: "/assets/objects/Coffee_Maker.png", 
      type: "item",
      interaction: "dispense"
    },
    { 
      key: "coffee_cup", 
      path: "/assets/objects/Coffee_Cup.png", 
      type: "item",
      scale: 0.5
    },
    { 
      key: "sink", 
      path: "/assets/objects/Sink.png", 
      type: "furniture" 
    },
    { 
      key: "bin", 
      path: "/assets/objects/Bins.png", 
      type: "decoration" 
    },

    // Trang trí khác
    { 
      key: "mailboxes", 
      path: "/assets/objects/Mailboxes.png", 
      type: "furniture" 
    },
    { 
      key: "office_portraits", 
      path: "/assets/objects/Office_Portraits.png", 
      type: "decoration" 
    },
    { 
      key: "shopping_cart", 
      path: "/assets/objects/Shopping_Cart.png", 
      type: "decoration" 
    },
  ] as AssetDefinition[],
};

/**
 * Hàm tiện ích để lấy danh sách phẳng tất cả asset (Dùng cho hàm preload của Phaser)
 */
export const getAllAssets = (): AssetDefinition[] => {
  return [
    ...ASSETS.backgrounds,
    ...ASSETS.tilesets,
    ...ASSETS.characters,
    ...ASSETS.furniture,
  ] as AssetDefinition[];
};

/**
 * Hàm lấy asset theo key
 */
export const getAssetByKey = (key: string): AssetDefinition | undefined => {
  return getAllAssets().find(a => a.key === key);
};