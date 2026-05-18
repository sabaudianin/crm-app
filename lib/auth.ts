import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
      organization: schema.organizations,
      member: schema.members,
      invitation: schema.invitations,
    },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // włącz na produkcji z emailem
    minPasswordLength: 8,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 dni
    updateAge: 60 * 60 * 24, // odświeżaj co 1 dzień
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // cache 5 minut
    },
  },

  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 3, // max organizacji na usera
      membershipLimit: 50, // max memberów w org
      sendInvitationEmail: async (data) => {
        // TODO: Resend
        console.log("Invitation email:", data.invitation.email);
      },
    }),
  ],

  //
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
