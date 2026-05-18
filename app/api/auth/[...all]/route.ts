import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
//Next js route handler for better auth
export const { GET, POST } = toNextJsHandler(auth);
