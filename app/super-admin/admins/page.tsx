"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ACCOUNT_STATUS, StatusBadge } from "@/components/ui/status-badge";
import { initialsFromName } from "@/lib/format";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandItem } from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScroller,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  assignHostelSchema,
  createHostelAdminSchema,
} from "@/lib/validation_schema";
import { adminApi, hostelApi } from "@/services/api";
import { Hostel, HostelAdmin, HostelStatus } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MoreHorizontal,
  Plus,
  Send,
  ShieldCheck,
  Trash,
  UserCheck,
  UserX,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface Admin extends HostelAdmin {}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);
  const [assignHostelLoading, setAssignHostelLoading] = useState(false);
  /** Which row currently has a status/invite request in flight. */
  const [busyAdminId, setBusyAdminId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof createHostelAdminSchema>>({
    resolver: zodResolver(createHostelAdminSchema),
    defaultValues: {
      name: "",
      email: "",
      hostelIds: [],
    },
  });

  const assignForm = useForm<z.infer<typeof assignHostelSchema>>({
    resolver: zodResolver(assignHostelSchema),
    defaultValues: {
      hostelIds: [],
    },
  });

  useEffect(() => {
    if (assignDialogOpen && selectedAdmin) {
      const initialHostelIds = selectedAdmin.hostels.map((hostel) => hostel.id);
      assignForm.reset({ hostelIds: initialHostelIds });
    }
  }, [assignDialogOpen, selectedAdmin, assignForm]);

  const fetchAdmins = async () => {
    try {
      const response = await adminApi.getAll();
      setAdmins(response);
    } catch (error) {
      toast.error("Failed to fetch admins");
    } finally {
      setLoading(false);
    }
  };

  const fetchHostels = async () => {
    try {
      const response = await hostelApi.getAll();
      setHostels(
        response.data.filter(
          (hostel: Hostel) => hostel.status === HostelStatus.ACTIVE,
        ),
      );
    } catch (error) {
      toast.error("Failed to fetch hostels");
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchHostels();
  }, []);

  const onSubmit = async (values: z.infer<typeof createHostelAdminSchema>) => {
    try {
      const created = await adminApi.create(values);

      // The account exists whether or not the mail went out, so say which
      // happened — silently claiming "invitation sent" would leave the super
      // admin waiting on an email that never left the building.
      if (created.emailSent) {
        toast.success(`Invitation sent to ${values.email}`);
      } else {
        toast.warning("Admin created, but the invitation email couldn't be sent", {
          description: "Use “Resend invite” once email delivery is configured.",
        });
      }

      setDialogOpen(false);
      form.reset();
      fetchAdmins();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    }
  };

  /** Activate / deactivate an admin, or send them a fresh invitation link. */
  const updateAdmin = async (
    admin: Admin,
    data: { status?: "ACTIVE" | "INACTIVE"; resendInvite?: boolean }
  ) => {
    setBusyAdminId(admin.id);
    try {
      const result = await adminApi.update(admin.id, data);

      if (data.resendInvite) {
        toast[result.emailSent ? "success" : "warning"](
          result.emailSent
            ? `New invitation sent to ${admin.email}`
            : "Invitation created, but the email couldn't be sent"
        );
      } else {
        toast.success(
          data.status === "INACTIVE"
            ? `${admin.name ?? admin.email} can no longer sign in`
            : `${admin.name ?? admin.email} reactivated`
        );
      }
      fetchAdmins();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusyAdminId(null);
    }
  };

  const onAssignHostel = async (values: z.infer<typeof assignHostelSchema>) => {
    if (!selectedAdmin) return;

    setAssignHostelLoading(true);
    try {
      await adminApi.assignHostel(selectedAdmin.id, values.hostelIds);

      toast.success("Hostels assigned to admin successfully");
      setAssignDialogOpen(false);
      assignForm.reset();
      fetchAdmins();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setAssignHostelLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    try {
      await adminApi.delete(adminId);

      toast.success("Admin deleted successfully");
      setDeleteDialogOpen(false);
      setAdminToDelete(null);
      fetchAdmins();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Hostel admins"
        description="Operators who run properties on the platform"
        breadcrumbs={[{ label: "Network" }, { label: "Hostel admins" }]}
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-3.5" />
                Add admin
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a hostel admin</DialogTitle>
              <DialogDescription>
                We&apos;ll email them a secure link to set their own password. The
                account stays inactive until they do — no temporary password is
                ever created or sent.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="warden@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hostelIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Assign properties{" "}
                        <span className="font-normal text-muted-foreground">
                          (optional)
                        </span>
                      </FormLabel>
                      <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-sm border border-border p-2.5">
                        {hostels.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No active hostels to assign yet.
                          </p>
                        ) : (
                          hostels.map((hostel) => {
                            const selected = (field.value ?? []).includes(hostel.id);
                            return (
                              <label
                                key={hostel.id}
                                className="flex cursor-pointer items-center gap-2 text-sm"
                              >
                                <Checkbox
                                  checked={selected}
                                  onCheckedChange={(checked) =>
                                    field.onChange(
                                      checked
                                        ? [...(field.value ?? []), hostel.id]
                                        : (field.value ?? []).filter(
                                            (id: string) => id !== hostel.id
                                          )
                                    )
                                  }
                                />
                                {hostel.name}
                              </label>
                            );
                          })
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}
                  <DialogFooter>
                    <Button type="submit">Send invitation</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      <Panel>
        <PanelHeader
          title="Administrators"
          description={loading ? "Loading…" : `${admins.length} on the platform`}
          icon={ShieldCheck}
        />
        {loading ? (
          <SkeletonTable rows={5} columns={4} />
        ) : admins.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No hostel admins yet"
            description="Create an admin account and assign it to a property so someone can run it."
            actionLabel="Add an admin"
            onAction={() => setDialogOpen(true)}
          />
        ) : (
          <TableScroller maxHeight="calc(100vh - 20rem)">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Admin</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned properties</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7">
                          <AvatarFallback>{initialsFromName(admin.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{admin.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        registry={ACCOUNT_STATUS}
                        value={admin.status}
                        size="sm"
                      />
                    </TableCell>
                    <TableCell>
                      {admin.hostels.length === 0 ? (
                        <span className="text-sm text-muted-foreground">Not assigned</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {admin.hostels.map((hostel) => (
                            <Badge key={hostel.id} variant="secondary">
                              {hostel.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="xs"
                          disabled={busyAdminId === admin.id}
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setAssignDialogOpen(true);
                          }}
                        >
                          Assign
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              disabled={busyAdminId === admin.id}
                            >
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">
                                More actions for {admin.name ?? admin.email}
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* Only meaningful while they still owe a password:
                                a resend would otherwise reset a working account
                                back to PENDING. */}
                            {admin.status !== "ACTIVE" && (
                              <DropdownMenuItem
                                onClick={() => updateAdmin(admin, { resendInvite: true })}
                              >
                                <Send className="mr-2 size-3.5" />
                                Resend invite
                              </DropdownMenuItem>
                            )}
                            {admin.status === "INACTIVE" ? (
                              <DropdownMenuItem
                                onClick={() => updateAdmin(admin, { status: "ACTIVE" })}
                              >
                                <UserCheck className="mr-2 size-3.5" />
                                Reactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => updateAdmin(admin, { status: "INACTIVE" })}
                              >
                                <UserX className="mr-2 size-3.5" />
                                Deactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-danger focus:bg-danger-subtle focus:text-danger"
                              onClick={() => {
                                setAdminToDelete(admin);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash className="mr-2 size-3.5" />
                              Delete account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableScroller>
        )}
      </Panel>

      <Dialog
        open={assignDialogOpen}
        onOpenChange={(open) => {
          setAssignDialogOpen(open);
          if (!open) {
            assignForm.reset({ hostelIds: [] });
            setSelectedAdmin(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Hostels to Admin</DialogTitle>
            <DialogDescription>
              Select hostels to assign to {selectedAdmin?.name}
            </DialogDescription>
          </DialogHeader>
          <Form {...assignForm}>
            <form
              onSubmit={assignForm.handleSubmit(onAssignHostel)}
              className="space-y-4"
            >
              <FormField
                control={assignForm.control}
                name="hostelIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Hostels</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                            >
                              {field.value?.length
                                ? `${field.value.length} hostels selected`
                                : "Select hostels"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] max-h-[300px] overflow-y-auto p-0">
                            <Command>
                              {hostels.map((hostel) => {
                                const isChecked = field.value?.includes(
                                  hostel.id,
                                );
                                return (
                                  <CommandItem
                                    key={hostel.id}
                                    onSelect={() => {
                                      const newValue = isChecked
                                        ? field.value?.filter(
                                            (id) => id !== hostel.id,
                                          )
                                        : [...(field.value || []), hostel.id];
                                      field.onChange(newValue);
                                    }}
                                  >
                                    <Checkbox
                                      checked={isChecked}
                                      className="mr-2"
                                    />
                                    {hostel.name}
                                  </CommandItem>
                                );
                              })}
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {/* ✅ Display selected hostels as badges */}
                        <div className="flex flex-wrap gap-2">
                          {field.value?.map((hostelId) => {
                            const hostel = hostels.find(
                              (h) => h.id === hostelId,
                            );
                            return (
                              hostel && (
                                <div
                                  key={hostelId}
                                  className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm"
                                >
                                  <span>{hostel.name}</span>
                                  {/* for uncheck selected hostel */}
                                  {/* <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() =>
                                      field.onChange(
                                        field.value.filter(
                                          (id) => id !== hostelId
                                        )
                                      )
                                    }
                                  >
                                    ×
                                  </Button> */}
                                </div>
                              )
                            );
                          })}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={assignHostelLoading}
                  className="w-full sm:w-auto"
                >
                  {assignHostelLoading ? "Assigning..." : "Assign Hostels"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {deleteDialogOpen && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                admin
                {adminToDelete?.hostels.length
                  ? ` and remove their access to ${
                      adminToDelete.hostels.length
                    } hostel${adminToDelete.hostels.length > 1 ? "s" : ""}`
                  : ""}
                .
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="w-full sm:w-auto">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  adminToDelete && handleDeleteAdmin(adminToDelete.id)
                }
                className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
