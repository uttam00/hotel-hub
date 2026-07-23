"use client";

import ChangePasswordForm from "@/components/forms/changePasswordform";
import ProfileForm from "@/components/forms/profileForm";
import EmergencyContactsForm from "@/components/forms/emergencyContactsForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

export default function ProfilePage() {
  const { user } = useAuth();
  const isStudent = user?.role === "STUDENT";

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <Tabs defaultValue="profile">
        <TabsList className={`grid w-full mb-4 ${isStudent ? "grid-cols-3" : "grid-cols-2"}`}>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Change Password</TabsTrigger>
          {isStudent && <TabsTrigger value="emergency">Emergency Contacts</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile">
          <ProfileForm />
        </TabsContent>
        <TabsContent value="password">
          <ChangePasswordForm />
        </TabsContent>
        {isStudent && (
          <TabsContent value="emergency">
            <EmergencyContactsForm />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
