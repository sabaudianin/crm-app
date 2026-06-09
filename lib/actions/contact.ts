import { db } from "@/lib/db";
import { contacts, activities } from "@/lib/db/schema";
import { contactSchema } from "../validations";
import { revalidatePath } from "next/cache";
import { ContactFormValues } from "../validations";
import { eq, and } from "drizzle-orm";
import { requireOrganization } from "@/lib/auth-session";

function nullifyEmpty<T extends Record<string, unknown>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === "" ? null : v]),
  ) as T;
}

async function logActivity(params: {
  organizationId: string;
  actorId: string;
  type: typeof activities.$inferInsert.type;
  entityType: string;
  entityId: string;
  entityName: string;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(activities).values({
    organizationId: params.organizationId,
    actorId: params.actorId,
    type: params.type,
    entityType: params.entityType,
    entityId: params.entityId,
    entityName: params.entityName,
    metadata: params.metadata ? JSON.stringify(params.metadata) : null,
  });
}

export async function createContact(values: ContactFormValues) {
  const session = await requireOrganization();
  const orgId = session.session.activeOrganizationId!;

  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Nieprawidłowe dane formularza" };
  }

  const data = nullifyEmpty(parsed.data) as typeof parsed.data;

  try {
    const [contact] = await db
      .insert(contacts)
      .values({
        ...data,
        organizationId: orgId,
        assignedToId: session.user.id,
      })
      .returning();

    await logActivity({
      organizationId: orgId,
      actorId: session.user.id,
      type: "contact_created",
      entityType: "contact",
      entityId: contact.id,
      entityName: `${contact.firstName}${contact.lastName ? " " + contact.lastName : ""}`,
    });

    revalidatePath("/contacts");
    return { success: true, contactId: contact.id };
  } catch {
    return { error: "Błąd podczas tworzenia kontaktu" };
  }
}

export async function updateContact(
  contactId: string,
  values: ContactFormValues,
) {
  const session = await requireOrganization();
  const orgId = session.session.activeOrganizationId!;

  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Nieprawidłowe dane formularza" };
  }

  const data = nullifyEmpty(parsed.data) as typeof parsed.data;

  try {
    const [contact] = await db
      .update(contacts)
      .set(data)
      .where(
        and(eq(contacts.id, contactId), eq(contacts.organizationId, orgId)),
      )
      .returning();

    if (!contact) return { error: "Kontakt nie istnieje" };

    await logActivity({
      organizationId: orgId,
      actorId: session.user.id,
      type: "contact_updated",
      entityType: "contact",
      entityId: contact.id,
      entityName: `${contact.firstName}${contact.lastName ? " " + contact.lastName : ""}`,
    });

    revalidatePath("/contacts");
    revalidatePath(`/contacts/${contactId}`);
    return { success: true };
  } catch {
    return { error: "Błąd podczas aktualizacji kontaktu" };
  }
}

export async function deleteContact(contactId: string) {
  const session = await requireOrganization();
  const orgId = session.session.activeOrganizationId!;

  try {
    await db
      .delete(contacts)
      .where(
        and(eq(contacts.id, contactId), eq(contacts.organizationId, orgId)),
      );

    revalidatePath("/contacts");
    return { success: true };
  } catch {
    return { error: "Błąd podczas usuwania kontaktu" };
  }
}

export async function getContacts() {
  const session = await requireOrganization();
  const orgId = session.session.activeOrganizationId!;

  return db.query.contacts.findMany({
    where: eq(contacts.organizationId, orgId),
    orderBy: (contacts, { desc }) => [desc(contacts.createdAt)],
    with: {
      assignedTo: {
        columns: { id: true, name: true, image: true },
      },
    },
  });
}

export async function getContact(contactId: string) {
  const session = await requireOrganization();
  const orgId = session.session.activeOrganizationId!;

  return db.query.contacts.findFirst({
    where: and(eq(contacts.id, contactId), eq(contacts.organizationId, orgId)),
    with: {
      assignedTo: {
        columns: { id: true, name: true, image: true },
      },
      deals: true,
      notes: {
        with: {
          author: { columns: { id: true, name: true, image: true } },
        },
        orderBy: (notes, { desc }) => [desc(notes.createdAt)],
      },
    },
  });
}
