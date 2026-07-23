import DashboardCard from "@/components/dashboardCard";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Building, Users, CreditCard, BarChart3 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SuperAdminDashboard() {
  const user = await getCurrentUser();

  if (!user || user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  const [totalHostels, totalAdmins, totalBookings, totalRevenue] =
    await Promise.all([
      prisma.hostel.count(),
      prisma.user.count({ where: { role: "HOSTEL_ADMIN" } }),
      prisma.booking.count(),
      prisma.payment
        .aggregate({
          _sum: { amount: true },
          where: { status: "COMPLETED" },
        })
        .then((r) => r._sum.amount || 0),
    ]);

  const cardData = [
    {
      title: "Total Hostels",
      count: totalHostels,
      description: "Manage all hostels and their admins",
      icon: Building,
      link: "/super-admin/hostels",
    },
    {
      title: "Hostel Admins",
      count: totalAdmins,
      description: "Manage hostel administrators",
      icon: Users,
      link: "/super-admin/admins",
    },
    {
      title: "Total Bookings",
      count: totalBookings,
      description: "All platform bookings",
      icon: CreditCard,
      link: "/super-admin/hostels",
    },
    {
      title: "Revenue",
      count: totalRevenue,
      description: "Total completed payments",
      icon: BarChart3,
      link: "/super-admin/hostels",
    },
  ];

  return (
    <div className="container mx-auto pb-8">
      <h1 className="text-2xl font-bold mb-8">Super Admin Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cardData.map(({ count, description, icon, link, title }, index) => {
          return (
            <Link href={link} key={`${index}-${title}`}>
              <DashboardCard
                cardDescription={description}
                cardIcon={icon}
                cardTitle={title}
                count={count}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
