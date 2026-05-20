import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
//endpoint Nexta
export const { GET, POST } = toNextJsHandler(auth);
