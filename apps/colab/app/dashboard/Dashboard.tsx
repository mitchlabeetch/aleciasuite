"use client";

/**
 * Dashboard Page - Main home page
 * Features: Welcome message, quick actions, recent documents, activity feed
 */

import { RecentFiles } from "@/components/recent-files";
import { Button } from "@/components/tailwind/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/tailwind/ui/card";
import { Separator } from "@/components/tailwind/ui/separator";
import { useDeals, useDocuments } from "@/hooks/use-convex";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { fr, t } from "@/lib/i18n";
import type { ColabDocument, ColabDeal } from "@/lib/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSession } from "@alepanel/auth/client";
import {
  ArrowRight,
  Briefcase,
  Building,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  LayoutDashboard,
  Users,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";
import { ADMIN_ROUTES, ALECIA_DOMAINS } from "@/lib/alecia-domains";

const quickActions = [
  {
    icon: Briefcase,
    label: fr.dashboard.quickAction.deal,
    href: "/pipeline",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: FileText,
    label: fr.dashboard.quickAction.document,
    href: "/documents",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Building,
    label: fr.dashboard.quickAction.company,
    href: "/companies",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Users,
    label: fr.dashboard.quickAction.contact,
    href: ADMIN_ROUTES.crm.contacts,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

const getTimestamp = (timestamp?: Date | null, fallback?: Date | null) =>
  (timestamp?.getTime() ?? fallback?.getTime() ?? 0);

const isDealNew = (deal: { updatedAt?: Date | null; createdAt?: Date | null }) =>
  !deal.updatedAt || deal.updatedAt === deal.createdAt;

const getInitials = (name?: string) => {
  if (!name) return "?";
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2) || "?"
  );
};

// Type definitions for Dashboard
interface StatItem {
  id: string;
  label: string;
  value: string;
  icon: typeof Briefcase;
  trend: string;
  color: string;
}

interface RecentDocumentItem {
  id: string;
  title: string;
  description: string;
  time: string;
  collaborators: number;
  href: string;
  timestamp: number;
}

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  timestamp: number;
}

interface DashboardUIProps {
  isLoaded: boolean;
  user:
    | { name?: string | null; id?: string }
    | null
    | undefined;
  initialStats: StatItem[];
  recentDocuments: RecentDocumentItem[];
  activityFeed: ActivityItem[];
  isDocumentsLoading: boolean;
  isDataLoading: boolean;
}

export default function Dashboard() {
  const [hasAuth, setHasAuth] = useState(false);

  // Check if BetterAuth is configured
  useEffect(() => {
    // BetterAuth is always available, no need to check for env vars
    setHasAuth(true);
  }, []);

  return hasAuth ? <DashboardContent /> : <DashboardContentMock />;
}

function DashboardContent() {
  const { data: session, isPending } = useSession();
  const {
    documents,
    isLoading: documentsLoading,
  } = useDocuments();
  const {
    deals,
    isLoading: dealsLoading,
  } = useDeals();

  // Reuse logic...
  // To avoid duplicating huge code blocks, I should have extracted the main logic.
  // But given constraints, I will keep it inline in this component
  // and have a mock component that doesn't use hooks.
  // Actually, I can just use a conditional hook call? No, that's illegal in React.
  // So splitting is correct.

  // Wait, duplicating the whole logic is bad.
  // I will refactor DashboardContent to accept user/data as props or use hooks if auth is present.
  // But useUser throws if not in provider.
  // So DashboardContent MUST be a separate component that is only rendered if auth is present.

  // However, I need to copy the logic.
  // Since I can't easily extract all the logic without rewriting a lot,
  // I will just use the existing logic for DashboardContent
  // and create a simplified mock for the "no-auth" case (dev environment).

  const isDocumentsLoading = documentsLoading;
  const isDealsLoading = dealsLoading;
  const isDataLoading = isPending || isDocumentsLoading || isDealsLoading;
  const activeDocuments = useMemo(
    () =>
      documents.filter((document: ColabDocument) => !document.isArchived),
    [documents],
  );
  const activeDeals = useMemo(
    () => deals.filter((deal: ColabDeal) => !deal.isArchived),
    [deals],
  );
  const inProgressDeals = useMemo(
    () =>
      activeDeals.filter(
        (deal: { stage: string }) =>
          !["closed-won", "closed-lost"].includes(deal.stage),
      ),
    [activeDeals],
  );
  const closedDeals = useMemo(
    () =>
      activeDeals.filter((deal: { stage: string }) =>
        ["closed-won", "closed-lost"].includes(deal.stage),
      ),
    [activeDeals],
  );
  const displayName =
    session?.user?.name || "Utilisateur";

  const memberIds = useMemo(() => {
    const ids = new Set<string>();
    if (session?.user?.id) {
      ids.add(session.user.id);
    }
    activeDocuments.forEach((document: { userId?: string }) => {
      if (document.userId) {
        ids.add(document.userId);
      }
    });
    // Note: deal.lead is a name string, not a user ID
    // Only count document userIds for member tracking
    // If deals have an ownerId (user ID), we could count that instead
    return ids;
  }, [activeDocuments, session?.user?.id]);

  const getDocumentTimestamp = useCallback(
    (document: ColabDocument) =>
      getTimestamp(
        document.updatedAt,
        document.createdAt,
      ),
    [],
  );

  const getDealTimestamp = useCallback(
    (deal: ColabDeal) =>
      getTimestamp(deal.updatedAt, deal.createdAt),
    [],
  );

  const recentDocuments = useMemo(
    () =>
      activeDocuments
        .map((document: ColabDocument) => {
          const timestamp = getDocumentTimestamp(document);
          return {
            id: document.id,
            title: document.title || t("editor.untitled"),
            description: document.dealId
              ? fr.dashboard.documentLinkedToDeal
              : fr.dashboard.documentCollaboration,
            time: formatRelativeTime(timestamp),
            collaborators: document.userId ? 1 : 0,
            href: `/documents/${document.id}`,
            timestamp,
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 3),
    [activeDocuments, getDocumentTimestamp],
  );

  const activityFeed = useMemo(
    () =>
      [
        ...activeDocuments.map((document: ColabDocument) => {
          const timestamp = getDocumentTimestamp(document);
          return {
            id: `document-${document.id}`,
            user:
              document.userId === session?.user?.id
                ? displayName
                : fr.common.collaborator,
            action: fr.activity.updatedDocument,
            target: document.title || t("editor.untitled"),
            time: formatRelativeTime(timestamp),
            timestamp,
          };
        }),
        ...activeDeals.map((deal: ColabDeal) => {
          const timestamp = getDealTimestamp(deal);
          const isNewDeal = isDealNew(deal);
          return {
            id: `deal-${deal.id}`,
            user: deal.leadName || fr.common.team,
            action: isNewDeal
              ? fr.activity.createdDeal
              : fr.activity.updatedDeal,
            target: deal.title,
            time: formatRelativeTime(timestamp),
            timestamp,
          };
        }),
      ]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5),
    [
      activeDeals,
      activeDocuments,
      displayName,
      session?.user?.id,
      getDocumentTimestamp,
      getDealTimestamp,
    ],
  );

  const initialStats = [
    {
      id: "deals",
      label: fr.dashboard.stats.dealsInProgress,
      value: isDataLoading ? "—" : inProgressDeals.length.toString(),
      icon: Briefcase,
      trend: isDataLoading
        ? fr.loader.loading
        : `${activeDeals.length} ${fr.common.total}`,
      color: "text-blue-500",
    },
    {
      id: "documents",
      label: fr.dashboard.stats.documentsCreated,
      value: isDataLoading ? "—" : activeDocuments.length.toString(),
      icon: FileText,
      trend: isDataLoading
        ? fr.loader.loading
        : recentDocuments[0]
          ? `${fr.dashboard.lastUpdate} ${recentDocuments[0].time}`
          : fr.dashboard.noDocuments,
      color: "text-green-500",
    },
    {
      id: "members",
      label: fr.dashboard.stats.teamMembers,
      value: isDataLoading ? "—" : memberIds.size.toString(),
      icon: Users,
      trend: isDataLoading
        ? fr.loader.loading
        : memberIds.size > 0
          ? fr.dashboard.activeTeam
          : fr.dashboard.noMembers,
      color: "text-purple-500",
    },
    {
      id: "tasks",
      label: fr.dashboard.stats.tasksCompleted,
      value: isDataLoading ? "—" : closedDeals.length.toString(),
      icon: CheckCircle2,
      trend: isDataLoading
        ? fr.loader.loading
        : closedDeals.length > 0
          ? `${closedDeals.length} ${fr.dashboard.dealsClosed}`
          : fr.dashboard.noClosedDeals,
      color: "text-orange-500",
    },
  ];

  return (
    <DashboardUI
      isLoaded={!isPending}
      user={session?.user}
      initialStats={initialStats}
      recentDocuments={recentDocuments}
      activityFeed={activityFeed}
      isDocumentsLoading={isDocumentsLoading}
      isDataLoading={isDataLoading}
    />
  );
}

// Mock content for dev/no-auth environment
function DashboardContentMock() {
  const initialStats = [
    {
      id: "deals",
      label: fr.dashboard.stats.dealsInProgress,
      value: "12",
      icon: Briefcase,
      trend: `15 ${fr.common.total}`,
      color: "text-blue-500",
    },
    {
      id: "documents",
      label: fr.dashboard.stats.documentsCreated,
      value: "8",
      icon: FileText,
      trend: `${fr.dashboard.lastUpdate} 2h ago`,
      color: "text-green-500",
    },
    {
      id: "members",
      label: fr.dashboard.stats.teamMembers,
      value: "4",
      icon: Users,
      trend: fr.dashboard.activeTeam,
      color: "text-purple-500",
    },
    {
      id: "tasks",
      label: fr.dashboard.stats.tasksCompleted,
      value: "5",
      icon: CheckCircle2,
      trend: `5 ${fr.dashboard.dealsClosed}`,
      color: "text-orange-500",
    },
  ];

  return (
    <DashboardUI
      isLoaded={true}
      user={{ name: "Demo User", id: "demo" }}
      initialStats={initialStats}
      recentDocuments={[]}
      activityFeed={[]}
      isDocumentsLoading={false}
      isDataLoading={false}
    />
  );
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bonjour";
  if (hour >= 12 && hour < 14) return "Bon Appétit";
  if (hour >= 14 && hour < 18) return "Bon après-midi";
  if (hour >= 18 && hour < 22) return "Bonne soirée";
  return "Bonne nuit";
};

// Sortable stat card component for @dnd-kit
function SortableStatCard({ stat }: { stat: StatItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : "auto",
  };

  const Icon = stat.icon;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="cursor-grab active:cursor-grabbing">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
          <Icon className={`h-4 w-4 ${stat.color}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stat.value}</div>
          <p className="text-xs text-muted-foreground">{stat.trend}</p>
        </CardContent>
      </Card>
    </div>
  );
}

// UI Component to share layout
function DashboardUI({
  isLoaded,
  user,
  initialStats,
  recentDocuments,
  activityFeed,
  isDocumentsLoading,
  isDataLoading,
}: DashboardUIProps) {
  const [stats, setStats] = useState(initialStats);
  const greeting = getGreeting();

  useEffect(() => {
    // Update stats when initialStats change (e.g. data loading)
    // Only update values, preserve order
    setStats((prevStats) => {
      const updatedStats = prevStats.map((s) => {
        const newStat = initialStats.find((is: StatItem) => is.id === s.id);
        return newStat ? { ...s, ...newStat } : s;
      });
      return updatedStats;
    });
  }, [initialStats]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stats.findIndex((s: StatItem) => s.id === active.id);
    const newIndex = stats.findIndex((s: StatItem) => s.id === over.id);

    setStats(arrayMove(stats, oldIndex, newIndex));
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold">
          {greeting}
          {isLoaded && user && (
            <span className="text-primary">
              , {user.name}
            </span>
          )}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {fr.dashboard.welcomeMessage}
        </p>
      </motion.div>

      {/* Stats Grid (DnD) */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={stats.map((s: StatItem) => s.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat: StatItem) => (
              <SortableStatCard key={stat.id} stat={stat} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Recent Files & Quick Navigation - Moved ABOVE Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {/* Recent Files Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{fr.dashboard.recentDocuments}</CardTitle>
            <CardDescription>
              {fr.dashboard.recentDocumentsDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* BetterAuth is always available */}
            <RecentFiles limit={5} showCreateButton={true} />
          </CardContent>
        </Card>

        {/* Quick Navigation Card */}
        <Card>
          <CardHeader>
            <CardTitle>{fr.dashboard.quickNavigation}</CardTitle>
            <CardDescription>
              {fr.dashboard.quickNavigationDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <a
                href={ADMIN_ROUTES.dashboard}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                {fr.dashboard.adminDashboard}
              </a>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <a
                href={ADMIN_ROUTES.crm.contacts}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Users className="h-4 w-4 mr-2" />
                {fr.dashboard.crmContacts}
              </a>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <a
                href={ADMIN_ROUTES.crm.companies}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Building className="h-4 w-4 mr-2" />
                {fr.dashboard.companies}
              </a>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <a
                href={ALECIA_DOMAINS.marketing}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Globe className="h-4 w-4 mr-2" />
                {fr.dashboard.website}
              </a>
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions - Revised: Smaller, No Title, More Comprehensive */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex gap-4 overflow-x-auto pb-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <div className="flex flex-col items-center gap-2 group cursor-pointer min-w-[80px]">
                  <div
                    className={`w-10 h-10 rounded-full ${action.bgColor} flex items-center justify-center transition-transform group-hover:scale-110`}
                  >
                    <Icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                    {action.label}
                  </span>
                </div>
              </Link>
            );
          })}
          {/* Add more generic entry button */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer min-w-[80px]">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-transform group-hover:scale-110">
              <Plus className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
              {fr.dashboard.quickAction.other}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Documents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{fr.dashboard.recentDocuments}</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/documents">
                    {fr.dashboard.viewAll}{" "}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isDocumentsLoading ? (
                <p className="text-sm text-muted-foreground">
                  {fr.loader.loading}
                </p>
              ) : recentDocuments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {fr.nav.noRecentDocuments}
                </p>
              ) : (
                <div className="space-y-4">
                  {recentDocuments.map(
                    (doc: RecentDocumentItem, index: number) => (
                      <div key={doc.id}>
                        <Link href={doc.href} className="block">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="rounded-lg bg-primary/10 p-2">
                                <FileText className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-medium">{doc.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {doc.description}
                                </p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {doc.time}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {doc.collaborators}{" "}
                                    {doc.collaborators === 1
                                      ? fr.common.collaboratorSingle
                                      : fr.common.collaboratorPlural}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                        {index < recentDocuments.length - 1 && (
                          <Separator className="mt-4" />
                        )}
                      </div>
                    ),
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>{fr.dashboard.activityFeed}</CardTitle>
            </CardHeader>
            <CardContent>
              {isDataLoading ? (
                <p className="text-sm text-muted-foreground">
                  {fr.loader.loading}
                </p>
              ) : activityFeed.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {fr.dashboard.noRecentActivity}
                </p>
              ) : (
                <div className="space-y-4">
                  {activityFeed.map((activity: ActivityItem) => {
                    const initials = getInitials(activity.user);
                    return (
                      <div key={activity.id} className="flex gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {initials || "?"}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{activity.user}</span>{" "}
                            <span className="text-muted-foreground">
                              {activity.action}
                            </span>{" "}
                            <span className="font-medium">
                              {activity.target}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
