"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

/**
 * Underlined tab bar rather than a pill segmented control.
 *
 * Segmented pills are a mobile idiom and they cap out at three or four items;
 * a resident profile needs seven (Overview, Stay, Finance, Attendance,
 * Visitors, Documents, Activity). An underline scales, aligns to the rule
 * grid the rest of the system uses, and reads as page navigation instead of
 * as a control.
 */
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // `no-scrollbar` keeps the strip scrollable when there are more tabs
      // than fit, without painting a track under the labels.
      "no-scrollbar flex h-9 items-center gap-4 overflow-x-auto border-b border-border text-muted-foreground",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // -1px bottom margin so the active rule sits *on* the list's border
      // rather than below it.
      "relative -mb-px inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-0.5 text-sm font-medium transition-ui",
      "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:border-primary data-[state=active]:text-foreground",
      "[&_svg]:size-4 [&_svg]:shrink-0",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
