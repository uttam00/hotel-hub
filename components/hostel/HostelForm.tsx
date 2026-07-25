"use client";

import { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HostelDetails } from "@/types";
import ImageUpload from "../ImageUpload";
import LocationPicker from "@/components/LocationPicker";
import { hostelFormSchema } from "@/lib/validation_schema";
import { roomApi } from "@/services/api/room";
import { toast } from "sonner";
import { RoomCard } from "./RoomCard";
import { RoomsSummary } from "./RoomsSummary";

export type HostelFormValues = z.infer<typeof hostelFormSchema>;
export type RoomFormValues = HostelFormValues["rooms"][number];

// The saved hostel this form needs back from its caller — just enough to
// know where to point the follow-up room create/update/delete calls.
type SavedHostel = { id: string };

interface HostelFormProps {
  initialData?: HostelDetails;
  onSubmit: (data: Omit<HostelFormValues, "rooms">) => Promise<SavedHostel>;
  // Fired only after the hostel AND its rooms have both saved successfully —
  // wrapper pages should do their redirect/success toast here instead of
  // inside onSubmit, since a room sync failure should keep the admin on the
  // page to retry.
  onSuccess?: () => void;
  isLoading?: boolean;
}

function toRoomFormValues(room: HostelDetails["rooms"][number]): RoomFormValues {
  return {
    id: room.id,
    roomNumber: room.roomNumber,
    roomName: room.roomName ?? "",
    roomType: room.roomType,
    customRoomType: room.customRoomType ?? "",
    description: room.description ?? "",
    price: room.price,
    capacity: room.capacity,
    status: room.status,
    hasAttachedBathroom: room.hasAttachedBathroom,
    acType: room.acType,
    cupboardType: room.cupboardType,
    amenities: room.amenities,
  };
}

function emptyRoom(): RoomFormValues {
  return {
    roomNumber: "",
    roomName: "",
    roomType: "SINGLE",
    customRoomType: "",
    description: "",
    price: 0,
    capacity: 1,
    status: "AVAILABLE",
    hasAttachedBathroom: false,
    acType: "FAN_ONLY",
    cupboardType: "NONE",
    amenities: [],
  };
}

export default function HostelForm({
  initialData,
  onSubmit,
  onSuccess,
  isLoading = false,
}: HostelFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState<string | null>(null);

  const form = useForm<HostelFormValues>({
    resolver: zodResolver(hostelFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      zipCode: initialData?.zipCode || "",
      latitude: initialData?.latitude ?? undefined,
      longitude: initialData?.longitude ?? undefined,
      amenities: initialData?.amenities || [],
      images: initialData?.images || [],
      country: initialData?.country || "USA",
      status: initialData?.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      rooms: initialData?.rooms?.map(toRoomFormValues) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rooms",
  });

  const watchedRooms = useWatch({ control: form.control, name: "rooms" }) || [];

  const handleLocationSelect = (location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude: number;
    longitude: number;
  }) => {
    form.setValue("address", location.address);
    form.setValue("city", location.city);
    form.setValue("state", location.state);
    form.setValue("zipCode", location.zipCode);
    form.setValue("country", location.country);
    form.setValue("latitude", location.latitude);
    form.setValue("longitude", location.longitude);
  };

  const handleSubmit = async (values: HostelFormValues) => {
    const { rooms, ...hostelFields } = values;

    setIsSubmitting(true);
    setSubmitPhase("Saving hostel details...");

    let savedHostel: SavedHostel;
    try {
      savedHostel = await onSubmit({
        ...hostelFields,
        latitude: hostelFields.latitude || undefined,
        longitude: hostelFields.longitude || undefined,
      });
    } catch {
      // The wrapper page's onSubmit already surfaced its own error toast.
      setIsSubmitting(false);
      setSubmitPhase(null);
      return;
    }

    const hostelId = savedHostel.id;

    setSubmitPhase("Syncing rooms...");
    const originalRooms = initialData?.rooms ?? [];
    const currentIds = new Set(rooms.filter((r) => r.id).map((r) => r.id));
    const toDelete = originalRooms.filter((r) => !currentIds.has(r.id));
    const toUpdate = rooms.filter((r) => r.id);
    const toCreate = rooms.filter((r) => !r.id);

    const errors: string[] = [];

    for (const room of toDelete) {
      try {
        await roomApi.delete(hostelId, room.id);
      } catch (e) {
        errors.push(`Room ${room.roomNumber}: ${e instanceof Error ? e.message : "failed to delete"}`);
      }
    }
    for (const room of toUpdate) {
      const { id, ...data } = room;
      try {
        await roomApi.update(hostelId, id!, data);
      } catch (e) {
        errors.push(`Room ${room.roomNumber}: ${e instanceof Error ? e.message : "failed to update"}`);
      }
    }
    for (const room of toCreate) {
      try {
        await roomApi.create(hostelId, room);
      } catch (e) {
        errors.push(`Room ${room.roomNumber || "(new)"}: ${e instanceof Error ? e.message : "failed to create"}`);
      }
    }

    setIsSubmitting(false);
    setSubmitPhase(null);

    if (errors.length) {
      toast.error(`Hostel saved, but ${errors.length} room(s) failed: ${errors.join("; ")}`);
      return;
    }

    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit(handleSubmit)(e);
        }}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hostel Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter hostel name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Enter hostel description"
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel>Location</FormLabel>
          <LocationPicker
            onLocationSelect={handleLocationSelect}
            initialAddress={form.getValues("address")}
            initialLatitude={form.getValues("latitude")}
            initialLongitude={form.getValues("longitude")}
          />
        </div>

        <FormField
          control={form.control}
          name="amenities"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hostel Amenities</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value.join(", ")}
                  onChange={(e) => {
                    const value = e.target.value;
                    const amenitiesArray = value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean);
                    field.onChange(amenitiesArray);
                  }}
                  placeholder="Enter amenities separated by commas"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Images</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value}
                  onChange={(urls) => field.onChange(urls)}
                  onRemove={(url) =>
                    field.onChange(field.value.filter((val) => val !== url))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hostel Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Rooms</h2>
            <p className="text-sm text-muted-foreground">
              Add, edit, or remove rooms for this hostel — there is no limit on how many you can add.
            </p>
          </div>

          <RoomsSummary rooms={watchedRooms as RoomFormValues[]} />

          <div className="space-y-3">
            {fields.map((field, index) => (
              <RoomCard
                key={field.id}
                form={form}
                index={index}
                onRemove={() => remove(index)}
                // useFieldArray's own `field.id` is a synthetic React key,
                // not our room's real database id (which is shadowed by it
                // in `fields`) — read the true value from form state: rooms
                // without a persisted id are new, so they start expanded.
                defaultOpen={!form.getValues(`rooms.${index}.id`)}
              />
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => append(emptyRoom())}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Room
          </Button>
        </div>

        <Button type="submit" disabled={isLoading || isSubmitting}>
          {isSubmitting ? submitPhase ?? "Saving..." : "Save"}
        </Button>
      </form>
    </Form>
  );
}
