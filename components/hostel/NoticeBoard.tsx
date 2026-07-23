"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Notice = { id: string; title: string; body: string; pinned: boolean; createdAt: string };

export function NoticeBoard({ hostelId }: { hostelId: string }) {
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    fetch(`/api/hostels/${hostelId}/notices`)
      .then((res) => res.json())
      .then(setNotices)
      .catch(() => setNotices([]));
  }, [hostelId]);

  if (notices.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Megaphone className="h-5 w-5" /> Notices
      </h2>
      <div className="mt-4 space-y-3">
        {notices.map((notice) => (
          <div key={notice.id} className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <p className="font-medium">{notice.title}</p>
              {notice.pinned && <Badge variant="secondary">Pinned</Badge>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{notice.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
