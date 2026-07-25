"use client";

import Link from "next/link";
import { Calendar, CreditCard, Users, DoorOpen, DoorClosed, Building } from "lucide-react";
import DashboardCard from "@/components/dashboardCard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useFetch } from "@/hooks/use-fetch";
import { useMyHostel } from "@/hooks/use-my-hostel";
import { hostelAdminApi } from "@/services/api";

// Client-rendered so the counts follow whichever hostel is picked in the
// selector, instead of the server component's old hard-coded `hostels[0]`.
export function HostelAdminDashboardStats() {
  const { hostel, loading: hostelLoading } = useMyHostel();
  const { data: stats, loading: statsLoading } = useFetch(
    hostel ? () => hostelAdminApi.getStats(hostel.id) : null,
    [hostel]
  );

  if (hostelLoading || (hostel && statsLoading)) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  if (!hostel) {
    return (
      <p className="text-muted-foreground">
        You don&apos;t manage any hostels yet.
      </p>
    );
  }

  const s = stats ?? {
    totalStudents: 0,
    totalBookings: 0,
    totalPayments: 0,
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
  };

  const cardData = [
    {
      title: "Total Students",
      count: s.totalStudents,
      description: "Manage student enrollments",
      icon: Users,
      link: "/hostel-admin/students",
    },
    {
      title: "Total Bookings",
      count: s.totalBookings,
      description: "View and manage all bookings",
      icon: Calendar,
      link: "/hostel-admin/bookings",
    },
    {
      title: "Total Payments",
      count: s.totalPayments,
      description: "View and manage all payments",
      icon: CreditCard,
      link: "/hostel-admin/payments",
    },
    {
      title: "Total Rooms",
      count: s.totalRooms,
      description: "All rooms in your hostel",
      icon: Building,
      link: `/hostel-admin/hostels/${hostel.id}/edit`,
    },
    {
      title: "Available Rooms",
      count: s.availableRooms,
      description: "Rooms ready for booking",
      icon: DoorOpen,
      link: `/hostel-admin/hostels/${hostel.id}/edit`,
    },
    {
      title: "Occupied Rooms",
      count: s.occupiedRooms,
      description: "Currently occupied rooms",
      icon: DoorClosed,
      link: `/hostel-admin/hostels/${hostel.id}/edit`,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cardData.map(({ count, description, icon, link, title }) => (
        <Link href={link} key={title}>
          <DashboardCard
            cardDescription={description}
            cardIcon={icon}
            cardTitle={title}
            count={count}
          />
        </Link>
      ))}
    </div>
  );
}
