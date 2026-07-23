import ChangePasswordForm from "@/components/forms/changePasswordform";

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <ChangePasswordForm />
    </div>
  );
}
