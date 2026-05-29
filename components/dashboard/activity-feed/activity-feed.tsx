"use client";

import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "motion/react";

// Typy aktywności
type ActivityType =
    | "contact_created"
    | "contact_updated"
    | "deal_created"
    | "deal_stage_changed"
    | "deal_won"
    | "deal_lost"
    | "note_added"
    | "member_joined";

interface Activity {
    id: string;
    type: ActivityType;
    entityName: string | null;
    metadata: string | null;
    createdAt: Date;
    actor: {
        id: string;
        name: string;
        image: string | null;
    };
}

interface ActivityFeedProps {
    activities: Activity[];
    organizationId: string;
}

const ACTIVITY_CONFIG: Record<
    ActivityType,
    { label: string; color: string }
> = {
    contact_created: { label: "Nowy kontakt", color: "bg-blue-100 text-blue-700" },
    contact_updated: { label: "Kontakt zaktualizowany", color: "bg-gray-100 text-gray-700" },
    deal_created: { label: "Nowy deal", color: "bg-violet-100 text-violet-700" },
    deal_stage_changed: { label: "Zmiana etapu", color: "bg-amber-100 text-amber-700" },
    deal_won: { label: "Deal wygrany", color: "bg-green-100 text-green-700" },
    deal_lost: { label: "Deal przegrany", color: "bg-red-100 text-red-700" },
    note_added: { label: "Nowa notatka", color: "bg-orange-100 text-orange-700" },
    member_joined: { label: "Nowy członek", color: "bg-indigo-100 text-indigo-700" },
};

function getInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function ActivityItem({ activity }: { activity: Activity }) {
    const config = ACTIVITY_CONFIG[activity.type];
    const metadata = activity.metadata ? JSON.parse(activity.metadata) : null;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-3 py-3 border-b last:border-0"
        >
            <Avatar className="size-8 shrink-0">
                <AvatarImage src={activity.actor.image ?? ""} />
                <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700 font-medium">
                    {getInitials(activity.actor.name)}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">
                        {activity.actor.name}
                    </span>
                    <Badge variant="secondary" className={`text-xs px-1.5 py-0 ${config.color} border-0`}>
                        {config.label}
                    </Badge>
                </div>

                {activity.entityName && (
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {activity.entityName}
                        {metadata?.from && metadata?.to && (
                            <span className="text-xs ml-1">
                                ({metadata.from} → {metadata.to})
                            </span>
                        )}
                    </p>
                )}

                <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                        locale: pl,
                    })}
                </p>
            </div>
        </motion.div>
    );
}

export function ActivityFeed({ activities: initialActivities, organizationId }: ActivityFeedProps) {
    const [activities, setActivities] = useState(initialActivities);
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        const es = new EventSource(`/api/sse?orgId=${organizationId}`);
        eventSourceRef.current = es;

        es.onmessage = (event) => {
            try {
                const newActivity: Activity = JSON.parse(event.data);
                setActivities((prev) => [newActivity, ...prev].slice(0, 20));
            } catch {

            }
        };

        return () => {
            es.close();
        };
    }, [organizationId]);

    return (
        <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">
                        Aktywność zespołu
                    </CardTitle>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                        Na żywo
                    </span>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[400px] px-6">
                    {activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-center">
                            <p className="text-sm text-muted-foreground">
                                Brak aktywności
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Dodaj pierwszy kontakt lub deal
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {activities.map((activity) => (
                                <ActivityItem key={activity.id} activity={activity} />
                            ))}
                        </AnimatePresence>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}