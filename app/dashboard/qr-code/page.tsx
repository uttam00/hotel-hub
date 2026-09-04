"use client";

import { useEffect, useState } from "react";
import { QrCode, ShieldAlert } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { qrApi } from "@/services/api";

export default function QrCodePage() {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    qrApi
      .getMyCode()
      .then((data) => setDataUrl(data.dataUrl))
      .catch(() => setDataUrl(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Entry pass"
        description="Show this at the gate to be marked present"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Entry pass" }]}
      />

      <Panel className="max-w-sm">
        <PanelHeader title="Your code" icon={QrCode} />
        <div className="flex justify-center p-6">
          {loading ? (
            <Skeleton className="size-56" />
          ) : dataUrl ? (
            // The QR is generated server-side as a data URL, so next/image
            // would add nothing here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dataUrl}
              alt="Your personal check-in QR code"
              className="size-56 rounded-sm border border-border bg-white p-2"
            />
          ) : (
            <EmptyState
              variant="inline"
              icon={QrCode}
              title="Couldn't load your code"
              description="Refresh the page, or ask your warden to mark you present manually."
            />
          )}
        </div>
      </Panel>

      <Alert variant="warning" className="max-w-sm">
        <ShieldAlert />
        <AlertDescription>
          This code identifies you personally. Don&apos;t share it or let anyone photograph it.
        </AlertDescription>
      </Alert>
    </div>
  );
}
