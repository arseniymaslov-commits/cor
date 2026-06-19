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
    addressee: payload.addressee || "",
    subject: payload.subject || "",
    summary: payload.summary || "",
    letterType: payload.letterType || payload.letter_type || "",
    executor: payload.executor || "",
    department: payload.department || "",
    deadline: payload.deadline || null
  };
}
