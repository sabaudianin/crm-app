"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const BREADCRUMB_MAP: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/contacts": "Kontakty",
    "/pipeline": "Pipeline",
    "/settings": "Ustawienia",
};

export function AppHeader() {
    const pathname = usePathname();
    const pageTitle = BREADCRUMB_MAP[pathname] ?? "FlowCRM";

    return (
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm font-medium text-foreground">{pageTitle}</span>
        </header>
    );
}