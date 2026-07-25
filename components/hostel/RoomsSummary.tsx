"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RoomFormValues } from "./HostelForm";

interface RoomsSummaryProps {
  rooms: RoomFormValues[];
}

// Live-computed stats driven by useWatch in the parent, so this re-renders
// as rooms are added/edited/removed before the form is ever saved.
export function RoomsSummary({ rooms }: RoomsSummaryProps) {
  const totalRooms = rooms.length;
  const activeRooms = rooms.filter((r) => r.status !== "INACTIVE").length;
  const totalCapacity = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
  const availableBeds = rooms
    .filter((r) => r.status === "AVAILABLE")
    .reduce((sum, r) => sum + (r.capacity || 0), 0);
  const occupiedBeds = rooms
    .filter((r) => r.status === "OCCUPIED")
    .reduce((sum, r) => sum + (r.capacity || 0), 0);

  const stats = [
    { label: "Total Student Capacity", value: totalCapacity, accent: "text-primary" },
    { label: "Total Rooms", value: totalRooms },
    { label: "Active Rooms", value: activeRooms },
    { label: "Available Beds", value: availableBeds, accent: "text-green-600 dark:text-green-400" },
    { label: "Occupied Beds", value: occupiedBeds, accent: "text-blue-600 dark:text-blue-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-3 sm:p-4">
          <p className="text-xs text-muted-foreground">{stat.label}</p>
          <p className={cn("text-2xl font-semibold", stat.accent)}>{stat.value}</p>
        </Card>
      ))}
    </div>
  );
}
