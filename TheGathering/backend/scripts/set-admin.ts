/**
 * Gán quyền admin cho một user theo email.
 * Cách chạy:
 *   npx tsx scripts/set-admin.ts <email>
 *   ADMIN_EMAIL=user@example.com npx tsx scripts/set-admin.ts
 *
 * Ví dụ: npx tsx scripts/set-admin.ts phatdeptrai@gmail.com
 */
import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

const email = process.argv[2] || process.env.ADMIN_EMAIL;
if (!email) {
  console.error("Cách dùng: npx tsx scripts/set-admin.ts <email>");
  console.error("   hoặc: ADMIN_EMAIL=user@example.com npx tsx scripts/set-admin.ts");
  process.exit(1);
}

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/gather-town";

async function main() {
  await mongoose.connect(uri);
  const user = await User.findOneAndUpdate(
    { email: email.trim().toLowerCase() },
    { $set: { role: "admin" } },
    { new: true }
  );
  if (!user) {
    console.error("Không tìm thấy user với email:", email);
    process.exit(1);
  }
  console.log("Đã gán role admin cho:", user.email, "| username:", user.username);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
