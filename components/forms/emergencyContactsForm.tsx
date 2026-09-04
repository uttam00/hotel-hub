"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { formatPhone } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Contact, Trash } from "lucide-react";
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
    <div className="flex flex-col gap-4">
      <Panel>
        <PanelHeader
          title="Emergency contacts"
          description="Who your hostel should call if something happens"
          icon={Contact}
        />
        {loading ? null : contacts.length === 0 ? (
          <EmptyState
            variant="inline"
            icon={Contact}
            title="No emergency contacts yet"
            description="Add a parent or guardian your hostel can reach in an emergency."
          />
        ) : (
          <ul className="divide-y divide-border">
            {contacts.map((contact) => (
              <li key={contact.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                    {contact.name}
                    {contact.isPrimary && <Badge variant="default">Primary</Badge>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {contact.relation} · {formatPhone(contact.phone)}
                  </p>
                </div>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label={`Remove ${contact.name}`}
                  onClick={() => handleRemove(contact.id)}
                >
                  <Trash className="size-3.5 text-muted-foreground" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel>
        <PanelHeader title="Add a contact" />
        <div className="space-y-4 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ec-name">Name</Label>
              <Input
                id="ec-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Sunita Sharma"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ec-phone">Phone</Label>
              <Input
                id="ec-phone"
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ec-relation">Relation</Label>
              <Input
                id="ec-relation"
                value={form.relation}
                onChange={(e) => setForm((f) => ({ ...f, relation: e.target.value }))}
                placeholder="Mother, father, guardian…"
              />
            </div>
            <label
              htmlFor="ec-primary"
              className="flex items-center gap-2 self-end pb-2 text-sm"
            >
              <Checkbox
                id="ec-primary"
                checked={form.isPrimary}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, isPrimary: !!checked }))
                }
              />
              Set as primary contact
            </label>
          </div>
          <div className="border-t border-border pt-3">
            <Button onClick={handleAdd} disabled={submitting}>
              {submitting ? "Adding…" : "Add contact"}
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
