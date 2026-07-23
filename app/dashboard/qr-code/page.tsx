"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function QrCodePage() {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/qr-code")
      .then((res) => res.json())
      .then((data) => setDataUrl(data.dataUrl))
      .catch(() => setDataUrl(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Check-in QR Code</h1>
          <p className="text-muted-foreground">Show this at the gate for attendance check-in</p>
        </div>
      </div>

      <Card className="max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <QrCode className="h-5 w-5" /> Your Code
          </CardTitle>
          <CardDescription>This code is personal — don&apos;t share it with anyone else.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-8">
          {loading ? (
            <LoadingSpinner message="Generating your code..." />
          ) : dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt="Your check-in QR code" className="h-64 w-64" />
          ) : (
            <p className="text-muted-foreground text-sm">Couldn&apos;t load your QR code. Try again later.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
