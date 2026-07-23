"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash, Megaphone } from "lucide-react";
import { TableLoader } from "@/components/ui/loader";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { useFetch } from "@/hooks/use-fetch";
import { useMyHostel } from "@/hooks/use-my-hostel";
import { noticeApi } from "@/services/api";

export default function NoticesPage() {
  const { hostel } = useMyHostel();
  const { data: notices, loading, refetch: fetchNotices } = useFetch(
    hostel ? () => noticeApi.getAll(hostel.id) : null,
    [hostel]
  );
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", pinned: false });

  const handleSubmit = async () => {
    if (!hostel) return;
    setSubmitting(true);
    try {
      await noticeApi.create(hostel.id, form);
      toast.success("Notice posted");
      setOpen(false);
      setForm({ title: "", body: "", pinned: false });
      fetchNotices();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post notice");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!hostel) return;
    try {
      await noticeApi.remove(hostel.id, id);
      toast.success("Notice deleted");
      fetchNotices();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete notice");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notice Board"
        description="Announcements visible to all your students"
        action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Megaphone className="mr-2 h-4 w-4" /> Post Notice</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Post a Notice</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} rows={4} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Posting..." : "Post"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        }
      />

      {loading ? (
        <TableLoader />
      ) : !notices || notices.length === 0 ? (
        <EmptyState title="No notices yet" description="Notices you post will appear here and on your hostel's page." />
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <Card key={notice.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{notice.title}</CardTitle>
                  {notice.pinned && <Badge variant="secondary">Pinned</Badge>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(notice.id)}>
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{notice.body}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(notice.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
