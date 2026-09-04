"use client";

import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

import ChangePasswordForm from "@/components/forms/changePasswordform";
import ProfileForm from "@/components/forms/profileForm";
import EmergencyContactsForm from "@/components/forms/emergencyContactsForm";
import { HostelSubscriptions } from "@/components/profile/HostelSubscriptions";
import { ProfileNav } from "@/components/profile/ProfileNav";
import { AdminLayoutShell } from "@/components/common-in-admin/AdminLayoutShell";
import { HostelSelectorBar } from "@/components/hostel-admin/HostelSelectorBar";
import { HostelProvider } from "@/contexts/hostel-context";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { initialsFromName } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function ProfilePageContent() {
  // Sourced from the NextAuth session (same as the header's account menu),
  // not the separate "user" cookie use-auth.ts reads — that cookie is only
  // ever set inside the login form's client code, so gating this page on it
  // left it stuck on a spinner forever whenever that cookie was missing
  // while the real session was still perfectly valid.
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "profile";

  if (status === "loading" || !session?.user) {
    return <LoadingSpinner fullPage message="Loading profile…" />;
  }

  const role = session.user.role;
  const isStudent = role === "STUDENT";
  const isHostelAdmin = role === "HOSTEL_ADMIN";

  const description =
    tab === "password"
      ? "Change the password you use to sign in."
      : tab === "emergency"
      ? "Who your hostel should contact if something happens."
      : "Your details, visible to the hostels you stay with.";

  const content = (
    <AdminLayoutShell
      role={role}
      // Keeps the role's real navigation in the sidebar. The profile sections
      // are tabs inside the page instead of a sidebar takeover.
      sidebarTopSlot={isHostelAdmin ? <HostelSelectorBar /> : undefined}
    >
      <div className="flex max-w-3xl flex-col gap-4">
        <PageHeader
          title="Profile"
          description={description}
          badge={
            <Avatar className="size-7">
              <AvatarFallback>{initialsFromName(session.user.name)}</AvatarFallback>
            </Avatar>
          }
        >
          <ProfileNav showEmergency={isStudent} />
        </PageHeader>

        {tab === "password" ? (
          <ChangePasswordForm />
        ) : tab === "emergency" && isStudent ? (
          <EmergencyContactsForm />
        ) : (
          <div className="flex flex-col gap-4">
            <ProfileForm />
            {isHostelAdmin && <HostelSubscriptions />}
          </div>
        )}
      </div>
    </AdminLayoutShell>
  );

  // The hostel selector (and anything else reading hostel context) needs a
  // provider; /profile sits outside the /hostel-admin layout that supplies it.
  return isHostelAdmin ? <HostelProvider>{content}</HostelProvider> : content;
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Loading profile…" />}>
      <ProfilePageContent />
    </Suspense>
  );
}
