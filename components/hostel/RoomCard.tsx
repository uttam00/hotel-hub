"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getRoomStatusColor } from "@/lib/status-colors";
import { ADDITIONAL_FACILITIES, GEYSER_KEY } from "@/lib/room-facilities";
import type { HostelFormValues } from "./HostelForm";

interface RoomCardProps {
  form: UseFormReturn<HostelFormValues>;
  index: number;
  onRemove: () => void;
  defaultOpen: boolean;
}

const ROOM_TYPE_OPTIONS = [
  { value: "SINGLE", label: "Single" },
  { value: "DOUBLE", label: "Double" },
  { value: "TRIPLE", label: "Triple" },
  { value: "DORMITORY", label: "Dormitory" },
  { value: "CUSTOM", label: "Custom" },
];

const ROOM_STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Available" },
  { value: "OCCUPIED", label: "Occupied" },
  { value: "MAINTENANCE", label: "Under Maintenance" },
  { value: "INACTIVE", label: "Inactive" },
];

export function RoomCard({ form, index, onRemove, defaultOpen }: RoomCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { control } = form;
  const name = `rooms.${index}` as const;

  const roomType = useWatch({ control, name: `${name}.roomType` });
  const roomNumber = useWatch({ control, name: `${name}.roomNumber` });
  const roomName = useWatch({ control, name: `${name}.roomName` });
  const capacity = useWatch({ control, name: `${name}.capacity` });
  const status = useWatch({ control, name: `${name}.status` });
  const amenities: string[] = useWatch({ control, name: `${name}.amenities` }) || [];

  const roomErrors = form.formState.errors.rooms?.[index];

  // An invalid collapsed room should surface itself on a failed submit
  // instead of silently staying hidden.
  useEffect(() => {
    if (roomErrors) setOpen(true);
  }, [roomErrors]);

  const toggleFacility = (key: string, checked: boolean) => {
    const current: string[] = form.getValues(`${name}.amenities`) || [];
    const next = checked ? [...current, key] : current.filter((k) => k !== key);
    form.setValue(`${name}.amenities`, next, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <Card className="overflow-hidden hover:-translate-y-0 hover:scale-100">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between gap-2 p-4">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <ChevronDown
                className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
              />
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {roomName ? `${roomName} — ` : ""}Room {roomNumber || "(new)"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {roomType === "CUSTOM" ? "Custom" : roomType} · {capacity || 0} beds
                </p>
              </div>
            </button>
          </CollapsibleTrigger>
          <div className="flex shrink-0 items-center gap-2">
            <Badge className={getRoomStatusColor(status)} variant="outline">
              {status}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              aria-label="Remove room"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        <CollapsibleContent>
          <div className="space-y-6 border-t border-border/40 p-4 pt-4 sm:p-6 sm:pt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={control}
                name={`${name}.roomNumber`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. 101" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`${name}.roomName`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Name (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="e.g. Deluxe Suite" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`${name}.capacity`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bed Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`${name}.price`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`${name}.roomType`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a room type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROOM_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {roomType === "CUSTOM" && (
                <FormField
                  control={control}
                  name={`${name}.customRoomType`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Room Type Label</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} placeholder="e.g. Family Suite" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={control}
                name={`${name}.status`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROOM_STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <FormField
                control={control}
                name={`${name}.hasAttachedBathroom`}
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Attached Washroom &amp; Bathroom</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value ? "yes" : "no"}
                        onValueChange={(v) => field.onChange(v === "yes")}
                        className="flex gap-4"
                      >
                        <label className="flex items-center gap-2 text-sm">
                          <RadioGroupItem value="yes" /> Yes
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <RadioGroupItem value="no" /> No
                        </label>
                      </RadioGroup>
                    </FormControl>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={amenities.includes(GEYSER_KEY)}
                        onCheckedChange={(checked) => toggleFacility(GEYSER_KEY, checked === true)}
                      />
                      Geyser
                    </label>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`${name}.acType`}
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Air Conditioning</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex gap-4"
                      >
                        <label className="flex items-center gap-2 text-sm">
                          <RadioGroupItem value="FAN_ONLY" /> Fan Only
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <RadioGroupItem value="FAN_AC" /> Fan + AC
                        </label>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`${name}.cupboardType`}
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Cupboard</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex flex-col gap-2"
                      >
                        <label className="flex items-center gap-2 text-sm">
                          <RadioGroupItem value="INDIVIDUAL" /> Individual Cupboard
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <RadioGroupItem value="SHARED" /> Shared/Common Cupboard
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <RadioGroupItem value="NONE" /> No Cupboard
                        </label>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <FormLabel>Additional Facilities</FormLabel>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                {ADDITIONAL_FACILITIES.filter((f) => f.key !== GEYSER_KEY).map((facility) => (
                  <label key={facility.key} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={amenities.includes(facility.key)}
                      onCheckedChange={(checked) => toggleFacility(facility.key, checked === true)}
                    />
                    {facility.label}
                  </label>
                ))}
              </div>
            </div>

            <FormField
              control={control}
              name={`${name}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Any additional information about this room"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
