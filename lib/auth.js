import crypto from "node:crypto";

export const SESSION_COOKIE = "rp_session";

export const defaultUsers = [
  {
    email: "arseniy.maslov@redpetroleum.kg",
    fullName: "Арсений Маслов",
    role: "admin",
    department: "Администрация"
  },
  {
    email: "zarina.akmatova@redpetroleum.kg",
    fullName: "Зарина Акматова",
    role: "clerk",
    department: "Канцелярия"
  }
];

export const roleLabels = {
  admin: "Администратор",
  clerk: "Делопроизводитель",
  deputy_ceo: "Заместитель генерального директора",
  executor: "Исполнитель",
  observer: "Наблюдатель"
};

function getSecret() {
  return process.env.AUTH_SECRET || "red-petroleum-local-dev-secret-change-in-vercel";
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64url(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash) {
    return false;
  }

  const [method, salt, hash] = storedHash.split("$");
  if (method !== "scrypt" || !salt || !hash) {
    return false;
  }

  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && crypto.timingSafeEqual(expected, candidate);
}

export function createSessionToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    fullName: user.full_name || user.fullName,
    role: user.role,
    department: user.department,
    exp: Date.now() + 1000 * 60 * 60 * 12
  };
  const body = base64url(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifySessionToken(token) {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [body, signature] = token.split(".");
  const expected = crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
  if (signature.length !== expected.length) {
    return null;
  }
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  const payload = JSON.parse(fromBase64url(body));
  if (!payload.exp || payload.exp < Date.now()) {
    return null;
  }

  return payload;
}

export async function ensureAuthSchema(sql) {
  await sql`alter table users add column if not exists password_hash text`;
  await sql`alter table users add column if not exists must_set_password boolean not null default true`;
  await sql`alter table users add column if not exists last_login_at timestamptz`;

  for (const user of defaultUsers) {
    await sql`
      insert into users(full_name, email, role, department, must_set_password)
      values (${user.fullName}, ${user.email}, ${user.role}, ${user.department}, true)
      on conflict(email) do update set
        full_name = excluded.full_name,
        role = excluded.role,
        department = excluded.department,
        is_active = true
    `;
  }
}

export function getDemoUser(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const demoUser = defaultUsers.find((user) => user.email === normalizedEmail);
  if (!demoUser) {
    return null;
  }

  return {
    id: normalizedEmail,
    email: demoUser.email,
    full_name: demoUser.fullName,
    role: demoUser.role,
    department: demoUser.department,
    password_hash: null,
    must_set_password: true,
    is_active: true
  };
}

export function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name || user.fullName,
    role: user.role,
    roleLabel: roleLabels[user.role] || user.role,
    department: user.department
  };
}
