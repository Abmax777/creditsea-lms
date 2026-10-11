import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDb } from "../config/db.js";
import { User } from "../models/User.js";
import type { Role } from "../domain/roles.js";

const password = process.env.SEED_PASSWORD ?? "Password@123";

const accounts: { name: string; email: string; role: Role }[] = [
  { name: "Admin", email: "admin@lms.test", role: "ADMIN" },
  { name: "Sales Executive", email: "sales@lms.test", role: "SALES" },
  { name: "Sanction Executive", email: "sanction@lms.test", role: "SANCTION" },
  { name: "Disbursement Executive", email: "disbursement@lms.test", role: "DISBURSEMENT" },
  { name: "Collection Executive", email: "collection@lms.test", role: "COLLECTION" },
  { name: "Test Borrower", email: "borrower@lms.test", role: "BORROWER" },
];

await connectDb();
await User.syncIndexes();
const passwordHash = await bcrypt.hash(password, 10);

for (const account of accounts) {
  await User.updateOne(
    { email: account.email },
    { $set: { name: account.name, role: account.role, passwordHash } },
    { upsert: true },
  );
  console.log(`${account.role.padEnd(13)} ${account.email} / ${password}`);
}

await mongoose.disconnect();
