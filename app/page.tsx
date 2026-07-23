import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building, Search, Star, Users } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // A logged-in user landing on the public marketing page — via a pasted
  // URL, a bookmark, or a reopened tab — belongs on their own dashboard, not
  // here. Mirrors the same redirect already used on /auth/login.
  if (session?.user) {
    switch (session.user.role) {
      case "SUPER_ADMIN":
        redirect("/super-admin");
      case "HOSTEL_ADMIN":
        redirect("/hostel-admin");
      case "STUDENT":
        redirect("/dashboard");
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Find Your Perfect Student Accommodation
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Browse through hundreds of hostels near your college or
                  university. Book securely and manage your stay all in one
                  place.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/hostels">
                    <Button size="lg" className="w-full min-[400px]:w-auto">
                      Browse Hostels
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full min-[400px]:w-auto"
                    >
                      Register Now
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[500px] aspect-video overflow-hidden rounded-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
                    <Building className="h-24 w-24 text-muted-foreground/50" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  How It Works
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Find and book your student accommodation in just a few simple
                  steps.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <Card className="border-2">
                <CardHeader className="pb-2">
                  <Search className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Search</CardTitle>
                  <CardDescription>
                    Find hostels near your college or university
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-2">
                <CardHeader className="pb-2">
                  <Star className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Compare</CardTitle>
                  <CardDescription>
                    Compare prices, amenities, and reviews
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-2">
                <CardHeader className="pb-2">
                  <Users className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Book</CardTitle>
                  <CardDescription>
                    Book securely and manage your stay
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
