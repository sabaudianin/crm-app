import { requireOrganization } from "@/lib/auth-session";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await requireOrganization();

    return (
        <SidebarProvider>
            <AppSidebar user={session.user} />
            <SidebarInset>
                <AppHeader />
                <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}