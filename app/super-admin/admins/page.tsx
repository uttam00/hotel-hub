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
import { TableLoader } from "@/components/ui/loader";
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
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  assignHostelSchema,
  createHostelAdminSchema,
} from "@/lib/validation_schema";
import { adminApi, hostelApi } from "@/services/api";
import { Hostel, HostelAdmin, HostelStatus } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
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

  const form = useForm<z.infer<typeof createHostelAdminSchema>>({
    resolver: zodResolver(createHostelAdminSchema),
    defaultValues: {
      name: "",
      email: "",
      // password: "",
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
      await adminApi.create(values);

      toast.success("Admin created successfully");
      setDialogOpen(false);
      form.reset();
      fetchAdmins();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Hostel Admins</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add New Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Admin</DialogTitle>
              <DialogDescription>
                Create a new hostel admin account.
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
                        <Input type="email" {...field} />
                      </FormControl>
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
                  <Button type="submit">Create Admin</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Name</TableHead>
              <TableHead className="min-w-[200px]">Email</TableHead>
              <TableHead className="min-w-[200px]">Assigned Hostels</TableHead>
              <TableHead className="min-w-[200px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <TableLoader />
                </TableCell>
              </TableRow>
            ) : admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No admins found
                </TableCell>
              </TableRow>
            ) : (
              admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.name}</TableCell>
                  <TableCell className="break-all">{admin.email}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="truncate">
                      {admin.hostels.map((hostel) => hostel.name).join(", ") ||
                        "Not assigned"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => {
                          setSelectedAdmin(admin);
                          setAssignDialogOpen(true);
                        }}
                      >
                        Assign Hostels
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => {
                          setAdminToDelete(admin);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
