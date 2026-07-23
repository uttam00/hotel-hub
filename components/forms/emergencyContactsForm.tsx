"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { userApi } from "@/services/api";
import type { EmergencyContact } from "@/services/api/user";

export default function EmergencyContactsForm() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", phone: "", relation: "", isPrimary: false });
  const [submitting, setSubmitting] = useState(false);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      setContacts(await userApi.getEmergencyContacts());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleAdd = async () => {
    if (!form.name || !form.phone || !form.relation) {
      toast.error("Fill in name, phone, and relation");
      return;
    }
    setSubmitting(true);
    try {
      await userApi.addEmergencyContact(form);
      toast.success("Emergency contact added");
      setForm({ name: "", phone: "", relation: "", isPrimary: false });
      fetchContacts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add contact");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await userApi.removeEmergencyContact(id);
      fetchContacts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove contact");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emergency Contacts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? null : contacts.length === 0 ? (
          <EmptyState title="No emergency contacts yet" description="Add a parent or guardian your hostel can reach in an emergency." />
        ) : (
          <div className="space-y-2">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">
                    {contact.name} {contact.isPrimary && <span className="text-xs text-primary">(Primary)</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">{contact.relation} · {contact.phone}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => handleRemove(contact.id)}>
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3 border-t pt-4">
          <p className="text-sm font-medium">Add a Contact</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label>Relation</Label>
              <Input
                value={form.relation}
                onChange={(e) => setForm((f) => ({ ...f, relation: e.target.value }))}
                placeholder="Father, Mother, Guardian..."
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Checkbox
                checked={form.isPrimary}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isPrimary: !!checked }))}
              />
              <Label className="font-normal">Set as primary contact</Label>
            </div>
          </div>
          <Button onClick={handleAdd} disabled={submitting}>
            {submitting ? "Adding..." : "Add Contact"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
