import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Pobierz sesję po stronie serwera (Server Components, Server Actions).
 * Zwraca null jeśli użytkownik nie jest zalogowany.
 */
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/**
 * Pobierz sesję lub przekieruj na /login.
 * w chronionych Server Components.
 */
export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/**
 * Pobierz sesję lub przekieruj na /dashboard.
 * na stronach auth (login, register).
 */
export async function requireGuest() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }
}
