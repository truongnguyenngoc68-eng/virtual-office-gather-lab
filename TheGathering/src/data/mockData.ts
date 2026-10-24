// src/data/mockData.ts
export type UserStatus = "Available" | "Focusing" | "Meeting" | "Offline" | "Away";

export interface User { id: string; name: string; role: string; avatar: string; status: UserStatus; location?: string; }
export interface Session { id: number; title: string; time: string; participants: number; category: "Tập trung" | "Giao lưu"; joined: boolean; }
export interface Room { id: string; name: string; description: string; type: "focus" | "social" | "meeting"; occupants: string[]; capacity: number; hasZoom?: boolean; }
export interface ForumThread { id: number; title: string; author: string; replies: number; category: string; }
export interface Resource { id: number; title: string; type: string; author: string; }
export interface ChatMessage { id: number; user: string; text: string; type: "system" | "message"; avatar?: string; time: string; }

export const CURRENT_USER: User = { id: "u1", name: "Alex Trần", role: "Thiết kế sản phẩm", avatar: "AT", status: "Focusing", location: "Khu vực tập trung" };

export const INITIAL_USERS: User[] = [
  { id: "u2", name: "Sarah Minh", avatar: "SM", status: "Available", role: "Lập trình viên" },
  { id: "u3", name: "Dũng Phạm", avatar: "DP", status: "Focusing", role: "Nhà văn" },
  { id: "u4", name: "Phương Lan", avatar: "PL", status: "Meeting", role: "Marketing" },
  { id: "u5", name: "Jordan Lý", avatar: "JL", status: "Focusing", role: "Nhà sáng lập" },
  { id: "u6", name: "Khánh Sơn", avatar: "KS", status: "Available", role: "Huấn luyện viên" },
];

export const INITIAL_SESSIONS: Session[] = [
  { id: 1, title: "Tập trung buổi sáng", time: "09:00 - 11:00", participants: 12, category: "Tập trung", joined: false },
  { id: 2, title: "Cà phê Freelancer", time: "13:00 - 14:00", participants: 5, category: "Giao lưu", joined: false },
  { id: 3, title: "Chạy nước rút", time: "15:30 - 17:00", participants: 8, category: "Tập trung", joined: false },
];

export const ROOMS: Room[] = [
  { id: "deep-work", name: "Thư Viện", description: "Im lặng tuyệt đối. Không bật mic.", type: "focus", occupants: ["u1", "u3", "u5"], capacity: 20 },
  { id: "lounge", name: "Phòng Chờ", description: "Làm việc thoải mái & Trò chuyện.", type: "social", occupants: ["u2", "u6"], capacity: 15 },
  { id: "meeting-1", name: "Phòng Họp A", description: "Đang có cuộc họp Zoom.", type: "meeting", occupants: ["u4"], hasZoom: true, capacity: 5 },
];

export const INITIAL_FORUM_THREADS: ForumThread[] = [
  { id: 1, title: "Mẹo giữ tập trung sau giờ ăn trưa?", author: "Sarah Minh", replies: 14, category: "Năng suất" },
  { id: 2, title: "Chuỗi bài tự giác hàng tuần: 24/10", author: "Team The Gathering", replies: 42, category: "Trách nhiệm" },
  { id: 3, title: "Giới thiệu: Xin chào từ Hà Nội!", author: "Hùng G.", replies: 6, category: "Làm quen" },
];

export const INITIAL_RESOURCES: Resource[] = [
  { id: 1, title: "Nghệ thuật làm việc sâu", type: "Hướng dẫn", author: "Cảm hứng từ Cal Newport" },
  { id: 2, title: "Danh sách kiểm tra sức khỏe từ xa", type: "Ebook", author: "The Gathering" },
  { id: 3, title: "Thiết lập ranh giới 101", type: "Khóa học", author: "Dr. Emily" },
  { id: 4, title: "Nhạc Lo-Fi để Code", type: "Âm thanh", author: "Cộng đồng" },
  { id: 5, title: "Chiến lược Pomodoro", type: "Hướng dẫn", author: "Francesco C." },
  { id: 6, title: "Yoga tại bàn làm việc", type: "Video", author: "Health Hub" },
];

export const INITIAL_CHAT: ChatMessage[] = [
  { id: 1, user: "Sarah Minh", text: "Sarah Minh đã vào Thư Viện.", type: "system", time: "2 phút trước" },
  { id: 2, user: "Dũng Phạm", text: "Dũng Phạm đổi trạng thái sang Tập trung sâu.", type: "system", time: "15 phút trước" },
  { id: 3, user: "Jordan C.", text: "Có ai rảnh để brainstorm nhanh 5 phút ở Phòng chờ không?", type: "message", avatar: "JC", time: "Vừa xong" },
];