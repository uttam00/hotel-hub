"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi, hostelApi } from "@/services/api";
import { Hostel, HostelAdmin } from "@/types";
import { Role } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { TableLoader } from "../ui/loader";
import { getInitialsFromEmail } from "@/lib/utils";
import { Plus } from "lucide-react";

interface HostelManagementProps {
  hostels: Hostel[];
  userRole: string;
  loading: boolean;
}

export default function HostelManagement({
  hostels,
  userRole,
  loading,
}: HostelManagementProps) {
  const isSuperAdmin = userRole === Role.SUPER_ADMIN;
  const router = useRouter();

  // Consolidated state for dialogs and hostel management
  const [state, setState] = useState<{
    selectedHostel: Hostel | null;
    admins: Array<Pick<HostelAdmin, "id" | "name" | "email">>;
    newAdminId: string;
    isAdminDialogOpen: boolean;
    isDeleteDialogOpen: boolean;
    isFetching: boolean;
  }>({
    selectedHostel: null,
    admins: [],
    newAdminId: "",
    isAdminDialogOpen: false,
    isDeleteDialogOpen: false,
    isFetching: false,
  });

  // Generic API handler with error handling and toast notifications
  const handleApiCall = useCallback(
    async (
      apiCall: () => Promise<unknown>,
      successMessage: string,
      errorMessage: string,
      callback?: () => void
    ) => {
      setState((prev) => ({ ...prev, isFetching: true }));
      try {
        await apiCall();
        toast.success(successMessage);
        callback?.();
      } catch (error: any) {
        const message =
          error?.response?.data?.message || // Axios style (if using Axios)
          error?.message || // Native fetch error
          errorMessage;

        toast.error(message);
        console.error(error);
      } finally {
        setState((prev) => ({ ...prev, isFetching: false }));
      }
    },
    []
  );

  // Fetch hostel admins
  const fetchHostelAdmins = useCallback(
    (hostelId: string) =>
      handleApiCall(
        async () => {
          const response = await adminApi.getByHostel(hostelId);
          setState((prev) => ({ ...prev, admins: response.admins }));
        },
        "Admins fetched successfully",
        "Failed to fetch hostel admins"
      ),
    [handleApiCall]
  );

  // Add admin to hostel
  const handleAddAdmin = useCallback(
    async (hostelId: string, adminEmail: string) => {
      const { initials, isValidEmail } = getInitialsFromEmail(adminEmail);
      if (!isValidEmail) {
        toast.error("Please enter a valid email");
        return;
      }

      await handleApiCall(
        async () => {
          const createdAdminData = await adminApi.create({
            name: initials,
            email: adminEmail,
          });

          await adminApi.assignHostel(createdAdminData.id, [hostelId]);
          setState((prev) => ({ ...prev, newAdminId: "" }));

          await fetchHostelAdmins(hostelId);
          setState((prev) => ({ ...prev, isAdminDialogOpen: false }));
        },
        "Admin added successfully and assigned to hostel",
        "Failed to add admin"
      );
    },
    [handleApiCall, fetchHostelAdmins]
  );

  // Remove admin from hostel
  const handleRemoveAdmin = useCallback(
    (hostelId: string, adminId: string) =>
      handleApiCall(
        async () => {
          await adminApi.unassignHostel(adminId, hostelId);
          await fetchHostelAdmins(hostelId);
        },
        "Admin removed successfully",
        "Failed to remove admin"
      ),
    [handleApiCall, fetchHostelAdmins]
  );

  // Delete hostel
  const handleDeleteHostel = useCallback(
    (hostelId: string) =>
      handleApiCall(
        async () => {
          await hostelApi.delete(hostelId);
          setState((prev) => ({
            ...prev,
            isDeleteDialogOpen: false,
            selectedHostel: null,
          }));
          router.refresh();
        },
        "Hostel deleted successfully",
        "Failed to delete hostel"
      ),
    [handleApiCall, router]
  );

  // Handle viewing admins for a specific hostel
  const handleViewAdmins = useCallback(
    (hostel: Hostel) => {
      setState((prev) => ({
        ...prev,
        selectedHostel: hostel,
        isAdminDialogOpen: true,
      }));
      fetchHostelAdmins(hostel.id);
    },
    [fetchHostelAdmins]
  );

  // Handle dialog state changes
  const handleDialogChange = useCallback(
    (dialogType: "admin" | "delete", open: boolean) => {
      setState((prev) => ({
        ...prev,
        [dialogType === "admin" ? "isAdminDialogOpen" : "isDeleteDialogOpen"]:
          open,
        selectedHostel: open ? prev.selectedHostel : null,
      }));
    },
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Hostel Management</h2>
        {isSuperAdmin && (
          <Button onClick={() => router.push("/super-admin/hostels/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Hostel
          </Button>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Rooms</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <TableLoader />
                </TableCell>
              </TableRow>
            ) : hostels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No hostels found
                </TableCell>
              </TableRow>
            ) : (
              hostels.map((hostel) => (
                <TableRow key={hostel.id}>
                  <TableCell className="font-medium">{hostel.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {hostel.description}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>{hostel.address}</div>
                      <div className="text-sm text-muted-foreground">
                        {hostel.city}, {hostel.state} {hostel.zipCode}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>
                        Available: {hostel.availableRooms}/{hostel.totalRooms}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Types:{" "}
                        {[
                          ...new Set(hostel.rooms.map((room) => room.roomType)),
                        ].join(", ")}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        hostel.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {hostel.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-center">
                      {isSuperAdmin && (
                        <Dialog
                          open={
                            state.isAdminDialogOpen &&
                            state.selectedHostel?.id === hostel.id
                          }
                          onOpenChange={(open) =>
                            handleDialogChange("admin", open)
                          }
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              onClick={() => handleViewAdmins(hostel)}
                            >
                              Manage Admins
                            </Button>
                          </DialogTrigger>
                          <DialogContent
                            onInteractOutside={(e) => e.preventDefault()}
                          >
                            <DialogHeader>
                              <DialogTitle>Manage Hostel Admins</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="newAdmin">Add New Admin</Label>
                                <div className="flex gap-2">
                                  <Input
                                    id="newAdmin"
                                    value={state.newAdminId}
                                    onChange={(e) =>
                                      setState((prev) => ({
                                        ...prev,
                                        newAdminId: e.target.value,
                                      }))
                                    }
                                    placeholder="Enter user ID"
                                    disabled={state.isFetching}
                                  />
                                  <Button
                                    onClick={() =>
                                      handleAddAdmin(
                                        hostel.id,
                                        state.newAdminId
                                      )
                                    }
                                    disabled={
                                      state.isFetching || !state.newAdminId
                                    }
                                  >
                                    Add
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>
                                  {state.selectedHostel?.name}'s Current Admins
                                </Label>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Name</TableHead>
                                      <TableHead>Email</TableHead>
                                      <TableHead>Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {state.isFetching ? (
                                      <TableRow>
                                        <TableCell colSpan={3}>
                                          <TableLoader />
                                        </TableCell>
                                      </TableRow>
                                    ) : state.admins.length === 0 &&
                                      !state.isFetching ? (
                                      <TableRow>
                                        <TableCell
                                          colSpan={3}
                                          className="text-center"
                                        >
                                          No admins assigned
                                        </TableCell>
                                      </TableRow>
                                    ) : (
                                      state.admins.map((admin) => (
                                        <TableRow key={admin.id}>
                                          <TableCell>{admin.name}</TableCell>
                                          <TableCell>{admin.email}</TableCell>
                                          <TableCell>
                                            <Button
                                              variant="destructive"
                                              size="sm"
                                              onClick={() =>
                                                handleRemoveAdmin(
                                                  hostel.id,
                                                  admin.id
                                                )
                                              }
                                              disabled={state.isFetching}
                                            >
                                              Remove
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))
                                    )}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      <Button
                        variant="outline"
                        onClick={() =>
                          router.push(
                            `/${
                              isSuperAdmin ? "super-admin" : "hostel-admin"
                            }/hostels/${hostel.id}/edit`
                          )
                        }
                      >
                        Edit
                      </Button>
                      {isSuperAdmin && (
                        <Dialog
                          open={
                            state.isDeleteDialogOpen &&
                            state.selectedHostel?.id === hostel.id
                          }
                          onOpenChange={(open) =>
                            handleDialogChange("delete", open)
                          }
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="destructive"
                              onClick={() =>
                                setState((prev) => ({
                                  ...prev,
                                  selectedHostel: hostel,
                                  isDeleteDialogOpen: true,
                                }))
                              }
                              disabled={state.isFetching}
                            >
                              Delete
                            </Button>
                          </DialogTrigger>
                          <DialogContent
                            onInteractOutside={(e) => e.preventDefault()}
                          >
                            <DialogHeader>
                              <DialogTitle>Delete Hostel</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p>
                                Are you sure you want to delete{" "}
                                <strong>{state.selectedHostel?.name}</strong>?
                                This action cannot be undone.
                              </p>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    setState((prev) => ({
                                      ...prev,
                                      isDeleteDialogOpen: false,
                                    }))
                                  }
                                  disabled={state.isFetching}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDeleteHostel(hostel.id)}
                                  disabled={state.isFetching}
                                >
                                  {state.isFetching ? "Deleting..." : "Delete"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
