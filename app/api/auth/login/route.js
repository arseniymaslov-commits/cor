import { NextResponse } from "next/server";
import { getSql } from "../../../../lib/db";
import {
  createSessionToken,
  ensureAuthSchema,
  getDemoUser,
  hashPassword,
  publicUser,
  SESSION_COOKIE,
  verifyPassword
} from "../../../../lib/auth";

function setSession(response, user) {
  response.cookies.set(SESSION_COOKIE, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return response;
}

export async function POST(request) {
  const { email = "", password = "", mode = "login" } = await request.json();
  const normalizedEmail = email.toLowerCase().trim();

  if (!normalizedEmail.endsWith("@redpetroleum.kg")) {
    return NextResponse.json({ error: "Используйте корпоративную почту Red Petroleum." }, { status: 403 });
  }

  if (mode === "set-password" && password.length < 8) {
    return NextResponse.json({ error: "Пароль должен быть не короче 8 символов." }, { status: 400 });
  }

  const sql = getSql();

  if (!sql) {
    const demoUser = getDemoUser(normalizedEmail);
    if (!demoUser) {
      return NextResponse.json({ error: "Пользователь не найден." }, { status: 404 });
    }

    if (mode === "check") {
      return NextResponse.json({ requiresPasswordSetup: true, user: publicUser(demoUser), database: "demo" });
    }

    if (mode === "set-password") {
      const response = NextResponse.json({ user: publicUser(demoUser), database: "demo" });
      return setSession(response, demoUser);
    }

    return NextResponse.json({ requiresPasswordSetup: true, user: publicUser(demoUser), database: "demo" });
  }

  await ensureAuthSchema(sql);
  const [user] = await sql`
    select id, full_name, email, role, department, is_active, password_hash, must_set_password
    from users
    where lower(email) = ${normalizedEmail}
    limit 1
  `;

  if (!user || !user.is_active) {
    return NextResponse.json({ error: "Пользователь не найден или отключен." }, { status: 404 });
  }

  if (mode === "check") {
    return NextResponse.json({
      requiresPasswordSetup: !user.password_hash || user.must_set_password,
      user: publicUser(user),
      database: "connected"
    });
  }

  if (!user.password_hash || user.must_set_password) {
    if (mode !== "set-password") {
      return NextResponse.json({ requiresPasswordSetup: true, user: publicUser(user), database: "connected" });
    }

    const passwordHash = hashPassword(password);
    const [updatedUser] = await sql`
      update users
      set password_hash = ${passwordHash}, must_set_password = false, last_login_at = now()
      where id = ${user.id}
      returning id, full_name, email, role, department
    `;
    const response = NextResponse.json({ user: publicUser(updatedUser), database: "connected" });
    return setSession(response, updatedUser);
  }

  if (!verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "Неверный пароль." }, { status: 401 });
  }

  await sql`update users set last_login_at = now() where id = ${user.id}`;
  const response = NextResponse.json({ user: publicUser(user), database: "connected" });
  return setSession(response, user);
}
