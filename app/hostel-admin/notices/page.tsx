"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Megaphone, Pin, Trash } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFetch } from "@/hooks/use-fetch";
import { useMyHostel } from "@/hooks/use-my-hostel";
import { useHostelAccessLevel } from "@/hooks/use-hostel-access";
import { noticeApi } from "@/services/api";
import { formatDateTime, formatRelativeDay } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EMPTY_FORM = { title: "", body: "", pinned: false };

export default function NoticesPage() {
  const { hostel } = useMyHostel();
  const {
    data: notices,
    loading,
    refetch: fetchNotices,
  } = useFetch(hostel ? () => noticeApi.getAll(hostel.id) : null, [hostel]);

  const { accessLevel } = useHostelAccessLevel(hostel?.id);
  const isLimited = accessLevel === "LIMITED";

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);

  const canSubmit = form.title.trim() && form.body.trim();

  const handleSubmit = async () => {
    if (!hostel || !canSubmit) return;
    setSubmitting(true);
    try {
      await noticeApi.create(hostel.id, form);
      toast.success("Notice posted to all residents");
      setOpen(false);
      setForm(EMPTY_FORM);
      fetchNotices();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post notice");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!hostel || !pendingDelete) return;
    try {
      await noticeApi.remove(hostel.id, pendingDelete.id);
      toast.success("Notice deleted");
      fetchNotices();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete notice");
    } finally {
      setPendingDelete(null);
    }
  };

  const postButton = (
    <Button disabled={isLimited} onClick={() => setOpen(true)}>
      <Megaphone className="size-3.5" />
      Post notice
    </Button>
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Notices"
        description="Announcements every resident sees"
        breadcrumbs={[{ label: "Operations" }, { label: "Notices" }]}
        action={
          isLimited ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>{postButton}</span>
                </TooltipTrigger>
                <TooltipContent>
                  Your subscription isn&apos;t active.{" "}
                  <Link href="/hostel-admin/billing" className="underline underline-offset-2">
                    Renew
                  </Link>{" "}
                  to post notices.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            postButton
          )
        }
      />

      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !notices || notices.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Megaphone}
            title="No notices posted"
            description="Post a notice and it appears here, on your hostel's public page, and in every resident's dashboard."
            actionLabel={isLimited ? undefined : "Post the first notice"}
            onAction={isLimited ? undefined : () => setOpen(true)}
          />
        </Panel>
      ) : (
        <ul className="flex flex-col gap-2">
          {/* Pinned notices float to the top — that is what pinning means. */}
          {[...notices]
            .sort((a, b) => Number(b.pinned) - Number(a.pinned))
            .map((notice) => (
              <li key={notice.id}>
                <article
                  className={cn(
                    "rounded-md border bg-card p-3",
                    notice.pinned ? "border-primary-border bg-primary-subtle/30" : "border-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-semibold text-foreground">{notice.title}</h2>
                        {notice.pinned && (
                          <Badge variant="default">
                            <Pin className="size-3" />
                            Pinned
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                        {notice.body}
                      </p>
                      <p
                        className="mt-2 text-xs text-faint"
                        title={formatDateTime(notice.createdAt)}
                      >
                        Posted {formatRelativeDay(notice.createdAt)}
                      </p>
                    </div>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      aria-label={`Delete notice: ${notice.title}`}
                      onClick={() => setPendingDelete({ id: notice.id, title: notice.title })}
                    >
                      <Trash className="size-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </article>
              </li>
            ))}
        </ul>
      )}

      {/* ---------- Compose drawer ---------- */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Post a notice</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="n-title">Title</Label>
              <Input
                id="n-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Water supply maintenance on Sunday"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="n-body">Message</Label>
              <Textarea
                id="n-body"
                rows={6}
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Water will be unavailable between 10 am and 2 pm while the tank is cleaned. Please store what you need in advance."
              />
            </div>
            <label className="flex items-start gap-2.5 rounded-sm border border-border p-2.5">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
                className="mt-0.5 size-4 accent-[hsl(var(--primary))]"
              />
              <span className="text-sm">
                <span className="font-medium text-foreground">Pin this notice</span>
                <span className="block text-xs text-muted-foreground">
                  Keeps it at the top of the board until removed.
                </span>
              </span>
            </label>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !canSubmit}>
              {submitting ? "Posting…" : "Post notice"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Deleting removes the notice for every resident, so it is confirmed
          rather than fired straight from a one-click icon button. */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this notice?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{pendingDelete?.title}&rdquo; will be removed from the board and from every
              resident&apos;s dashboard. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className={cn(buttonVariants({ variant: "destructive-solid" }))}
            >
              Delete notice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
