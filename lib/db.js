import { neon } from "@neondatabase/serverless";

export function getSql() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  return neon(process.env.DATABASE_URL);
}

export function toDatabaseDocument(payload) {
  return {
    type: payload.type || "Входящая",
    status: payload.status || "Новое",
    sender: payload.sender || "",
    recipient: payload.recipient || "",
    subject: payload.subject || "",
    executor: payload.executor || "",
    department: payload.department || "",
    deadline: payload.deadline || null
  };
}
