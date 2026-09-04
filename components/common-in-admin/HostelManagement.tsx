"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, MoreHorizontal, Pencil, Plus, ShieldCheck, Trash } from "lucide-react";
import { Role } from "@prisma/client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScroller,
} from "@/components/ui/table";
import { HOSTEL_STATUS, StatusBadge } from "@/components/ui/status-badge";
import { adminApi, hostelApi } from "@/services/api";
import { getInitialsFromEmail } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import type { Hostel, HostelAdmin } from "@/types";

interface HostelManagementProps {
  hostels: Hostel[];
  userRole: string;
  loading: boolean;
}

/**
 * The property register, shared by the super-admin (who can create, delete and
 * assign admins) and the hostel-admin (who can only edit their own).
 *
 * Restructured so the dialogs live once at the component root rather than being
 * instantiated inside every table row — the previous version mounted a Dialog
 * per hostel, so a hundred properties meant a hundred portals.
 */
export default function HostelManagement({
  hostels,
  userRole,
  loading,
}: HostelManagementProps) {
  const isSuperAdmin = userRole === Role.SUPER_ADMIN;
  const router = useRouter();

  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
  const [admins, setAdmins] = useState<Array<Pick<HostelAdmin, "id" | "name" | "email">>>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [adminsOpen, setAdminsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const handleApiCall = useCallback(
    async (
      apiCall: () => Promise<unknown>,
      successMessage: string,
      errorMessage: string,
      callback?: () => void
    ) => {
      setIsFetching(true);
      try {
        await apiCall();
        toast.success(successMessage);
        callback?.();
      } catch (error: any) {
        toast.error(error?.response?.data?.message || error?.message || errorMessage);
        console.error(error);
      } finally {
        setIsFetching(false);
      }
    },
    []
  );

  const fetchHostelAdmins = useCallback(
    (hostelId: string) =>
      handleApiCall(
        async () => {
          const response = await adminApi.getByHostel(hostelId);
          setAdmins(response.admins);
        },
        "Admins loaded",
        "Failed to fetch hostel admins"
      ),
    [handleApiCall]
  );

  const handleAddAdmin = useCallback(
    async (hostelId: string, adminEmail: string) => {
      const { initials, isValidEmail } = getInitialsFromEmail(adminEmail);
      if (!isValidEmail) {
        toast.error("Please enter a valid email");
        return;
      }

      await handleApiCall(
        async () => {
          const created = await adminApi.create({ name: initials, email: adminEmail });
          await adminApi.assignHostel(created.id, [hostelId]);
          setNewAdminEmail("");
          await fetchHostelAdmins(hostelId);
        },
        "Admin added and assigned to this hostel",
        "Failed to add admin"
      );
    },
    [handleApiCall, fetchHostelAdmins]
  );

  const handleRemoveAdmin = useCallback(
    (hostelId: string, adminId: string) =>
      handleApiCall(
        async () => {
          await adminApi.unassignHostel(adminId, hostelId);
          await fetchHostelAdmins(hostelId);
        },
        "Admin removed",
        "Failed to remove admin"
      ),
    [handleApiCall, fetchHostelAdmins]
  );

  const handleDeleteHostel = useCallback(
    (hostelId: string) =>
      handleApiCall(
        async () => {
          await hostelApi.delete(hostelId);
          setDeleteOpen(false);
          setSelectedHostel(null);
          router.refresh();
        },
        "Hostel deleted",
        "Failed to delete hostel"
      ),
    [handleApiCall, router]
  );

  const openAdmins = (hostel: Hostel) => {
    setSelectedHostel(hostel);
    setAdminsOpen(true);
    setAdmins([]);
    fetchHostelAdmins(hostel.id);
  };

  const editHref = (id: string) =>
    `/${isSuperAdmin ? "super-admin" : "hostel-admin"}/hostels/${id}/edit`;

  return (
    <>
      <Panel>
        <PanelHeader
          title="Properties"
          description={loading ? "Loading…" : `${hostels.length} on record`}
          icon={Building2}
          action={
            isSuperAdmin ? (
              <Button size="xs" onClick={() => router.push("/super-admin/hostels/new")}>
                <Plus className="size-3.5" />
                Add hostel
              </Button>
            ) : undefined
          }
        />

        {loading ? (
          <SkeletonTable rows={5} columns={5} />
        ) : hostels.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No properties yet"
            description={
              isSuperAdmin
                ? "Add a hostel to start onboarding rooms, admins and residents."
                : "No hostel has been assigned to your account yet."
            }
            actionLabel={isSuperAdmin ? "Add a hostel" : undefined}
            actionHref={isSuperAdmin ? "/super-admin/hostels/new" : undefined}
          />
        ) : (
          <TableScroller maxHeight="calc(100vh - 20rem)">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Hostel</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead numeric>Rooms</TableHead>
                  <TableHead>Room types</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {hostels.map((hostel) => {
                  const types = [...new Set((hostel.rooms ?? []).map((r) => r.roomType))];
                  return (
                    <TableRow key={hostel.id}>
                      <TableCell>
                        <p className="font-medium text-foreground">{hostel.name}</p>
                        <p className="max-w-[18rem] truncate text-xs text-muted-foreground">
                          {hostel.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="max-w-[16rem] truncate">{hostel.address}</p>
                        <p className="text-xs text-muted-foreground">
                          {hostel.city}, {hostel.state} {hostel.zipCode}
                        </p>
                      </TableCell>
                      <TableCell numeric>
                        {formatNumber(hostel.availableRooms)}
                        <span className="text-muted-foreground">
                          /{formatNumber(hostel.totalRooms)}
                        </span>
                        <span className="block text-2xs text-muted-foreground">available</span>
                      </TableCell>
                      <TableCell className="max-w-[12rem] truncate text-muted-foreground">
                        {types.length > 0 ? types.join(", ") : "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge registry={HOSTEL_STATUS} value={hostel.status} size="sm" />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-xs">
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Actions for {hostel.name}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(editHref(hostel.id))}>
                              <Pencil className="mr-2 size-3.5" />
                              Edit details
                            </DropdownMenuItem>
                            {isSuperAdmin && (
                              <DropdownMenuItem onClick={() => openAdmins(hostel)}>
                                <ShieldCheck className="mr-2 size-3.5" />
                                Manage admins
                              </DropdownMenuItem>
                            )}
                            {isSuperAdmin && (
                              <DropdownMenuItem
                                className="text-danger focus:bg-danger-subtle focus:text-danger"
                                onClick={() => {
                                  setSelectedHostel(hostel);
                                  setDeleteOpen(true);
                                }}
                              >
                                <Trash className="mr-2 size-3.5" />
                                Delete hostel
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableScroller>
        )}
      </Panel>

      {/* ---------- Manage admins drawer ---------- */}
      <Sheet open={adminsOpen} onOpenChange={setAdminsOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Admins for {selectedHostel?.name}</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="new-admin">Add an admin by email</Label>
              <div className="flex gap-1.5">
                <Input
                  id="new-admin"
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="warden@example.com"
                  disabled={isFetching}
                />
                <Button
                  onClick={() => selectedHostel && handleAddAdmin(selectedHostel.id, newAdminEmail)}
                  disabled={isFetching || !newAdminEmail}
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Creates the account if it doesn&apos;t exist and assigns it to this hostel.
              </p>
            </div>

            <div>
              <h3 className="label-annotation mb-1.5">Current admins</h3>
              {isFetching && admins.length === 0 ? (
                <SkeletonTable rows={2} columns={2} />
              ) : admins.length === 0 ? (
                <p className="rounded-sm border border-border bg-muted/40 px-2.5 py-3 text-sm text-muted-foreground">
                  Nobody is assigned to this hostel yet.
                </p>
              ) : (
                <ul className="divide-y divide-border rounded-sm border border-border">
                  {admins.map((admin) => (
                    <li key={admin.id} className="flex items-center gap-2 px-2.5 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{admin.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
                      </div>
                      <Button
                        variant="destructive"
                        size="xs"
                        onClick={() =>
                          selectedHostel && handleRemoveAdmin(selectedHostel.id, admin.id)
                        }
                        disabled={isFetching}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* ---------- Delete confirmation ---------- */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedHostel?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the hostel along with its rooms, bookings, payments and
              notices. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isFetching}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Keep the dialog up while the request is in flight so the
                // pending state is visible rather than the dialog vanishing.
                e.preventDefault();
                if (selectedHostel) handleDeleteHostel(selectedHostel.id);
              }}
              disabled={isFetching}
              className={buttonVariants({ variant: "destructive-solid" })}
            >
              {isFetching ? "Deleting…" : "Delete hostel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
