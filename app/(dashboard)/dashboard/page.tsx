import { requireOrganization } from "@/lib/auth-session";
import { db } from "@/lib/db";
import { contacts, deals, activities } from "@/lib/db/schema";
import { eq, desc, count, and } from "drizzle-orm";
import { Users, Kanban, TrendingUp, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { formatDistanceToNow } from "@/lib/utils";

async function getDashboardData(organizationId: string) {
    const [
        totalContacts,
        totalDeals,
        wonDeals,
        recentActivities,
    ] = await Promise.all([
        db
            .select({ count: count() })
            .from(contacts)
            .where(eq(contacts.organizationId, organizationId)),

        db
            .select({ count: count() })
            .from(deals)
            .where(eq(deals.organizationId, organizationId)),

        db
            .select({ count: count() })
            .from(deals)
            .where(
                and(
                    eq(deals.organizationId, organizationId),
                    eq(deals.stage, "won")
                )
            ),

        db.query.activities.findMany({
            where: eq(activities.organizationId, organizationId),
            orderBy: [desc(activities.createdAt)],
            limit: 20,
            with: {
                actor: {
                    columns: { id: true, name: true, image: true },
                },
            },
        }),
    ]);

    return {
        totalContacts: totalContacts[0]?.count ?? 0,
        totalDeals: totalDeals[0]?.count ?? 0,
        wonDeals: wonDeals[0]?.count ?? 0,
        recentActivities,
    };
}

const stats = [
    {
        key: "totalContacts" as const,
        label: "Kontakty",
        icon: Users,
        description: "Łączna liczba kontaktów",
        color: "text-blue-600",
        bg: "bg-blue-50",
    },
    {
        key: "totalDeals" as const,
        label: "Deale",
        icon: Kanban,
        description: "Aktywne w pipeline",
        color: "text-violet-600",
        bg: "bg-violet-50",
    },
    {
        key: "wonDeals" as const,
        label: "Wygrane",
        icon: Target,
        description: "Zamknięte pomyślnie",
        color: "text-green-600",
        bg: "bg-green-50",
    },
];

export default async function DashboardPage() {
    const session = await requireOrganization();
    const orgId = session.session.activeOrganizationId!;

    const data = await getDashboardData(orgId);

    const winRate =
        data.totalDeals > 0
            ? Math.round((data.wonDeals / data.totalDeals) * 100)
            : 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Witaj z powrotem, {session.user.name.split(" ")[0]}
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.key}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.label}
                            </CardTitle>
                            <div className={`rounded-lg p-2 ${stat.bg}`}>
                                <stat.icon className={`size-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data[stat.key]}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}

                {/* Win rate card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Win Rate
                        </CardTitle>
                        <div className="rounded-lg p-2 bg-amber-50">
                            <TrendingUp className="size-4 text-amber-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{winRate}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Skuteczność zamykania dealów
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Activity Feed */}
            <div className="grid gap-4 lg:grid-cols-2">
                <ActivityFeed
                    activities={data.recentActivities}
                    organizationId={orgId}
                />
            </div>
        </div>
    );
}