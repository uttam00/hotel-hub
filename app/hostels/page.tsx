"use client";

import type React from "react";

import HostelCard from "@/components/hostel/HostelCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { hostelApi } from "@/services/api";
import { Hostel } from "@/types";
import { Filter, Search, X } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

export default function HostelsPage() {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchCity, setSearchCity] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("recommended");

  // Filter state
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const amenitiesList = [
    "Wi-Fi",
    "AC",
    "Laundry",
    "Gym",
    "Cafeteria",
    "Study Room",
    "Parking",
    "Security",
  ];

  const fetchHostels = useCallback(async () => {
    try {
      setLoading(true);

      // Map sortBy to API sort param
      let sort: string | undefined;
      if (sortBy === "price-low") sort = "price_asc";
      else if (sortBy === "price-high") sort = "price_desc";
      else if (sortBy === "rating") sort = "rating";

      const response = await hostelApi.getAll({
        city: searchCity || undefined,
        page: currentPage,
        limit: 6,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        amenities:
          selectedAmenities.length > 0
            ? selectedAmenities.join(",")
            : undefined,
        sort,
      });
      setHostels(response.data);
      setTotalPages(response.pagination.pages);
      setError(null);
    } catch (err) {
      console.error("Error fetching hostels:", err);
      setError("Failed to load hostels. Please try again.");
      setHostels([]);
    } finally {
      setLoading(false);
    }
  }, [searchCity, currentPage, sortBy, minPrice, maxPrice, selectedAmenities]);

  useEffect(() => {
    fetchHostels();
  }, [fetchHostels]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleSort = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setSelectedAmenities([]);
    setSortBy("recommended");
    setSearchCity("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    minPrice || maxPrice || selectedAmenities.length > 0;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="w-full py-6 md:py-10">
          <div className="container px-4 md:px-6">
            <Card className="space-y-6 p-6 sm:p-8 lg:p-10">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Find Your Hostel
                </h1>
                <p className="text-muted-foreground">
                  Browse through our collection of student hostels
                </p>
              </div>

              <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-4">
                <div className="md:col-span-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search by city"
                        className="pl-8"
                        value={searchCity}
                        onChange={(e) => setSearchCity(e.target.value)}
                      />
                    </div>
                    <Button type="submit">Search</Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 md:hidden"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                      <span className="ml-1 bg-primary text-primary-foreground rounded-full h-5 w-5 text-xs flex items-center justify-center">
                        {selectedAmenities.length +
                          (minPrice ? 1 : 0) +
                          (maxPrice ? 1 : 0)}
                      </span>
                    )}
                  </Button>
                </div>
              </form>

              <Separator />

              <div className="grid gap-8 md:grid-cols-4">
                {/* Sidebar Filters */}
                <div
                  className={`space-y-6 md:col-span-1 md:border-r md:border-border/40 md:pr-6 ${
                    showFilters ? "block" : "hidden md:block"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Filters</h3>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs gap-1"
                        onClick={clearFilters}
                      >
                        <X className="h-3 w-3" />
                        Clear
                      </Button>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                      Price Range
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label htmlFor="min-price" className="text-xs text-muted-foreground">
                          Min
                        </label>
                        <Input
                          id="min-price"
                          type="number"
                          placeholder="$0"
                          value={minPrice}
                          onChange={(e) => {
                            setMinPrice(e.target.value);
                            setCurrentPage(1);
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="max-price" className="text-xs text-muted-foreground">
                          Max
                        </label>
                        <Input
                          id="max-price"
                          type="number"
                          placeholder="$1000"
                          value={maxPrice}
                          onChange={(e) => {
                            setMaxPrice(e.target.value);
                            setCurrentPage(1);
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                      Amenities
                    </h4>
                    <div className="space-y-2">
                      {amenitiesList.map((amenity) => (
                        <label
                          key={amenity}
                          htmlFor={`amenity-${amenity}`}
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            id={`amenity-${amenity}`}
                            className="h-4 w-4 rounded border-border accent-primary"
                            checked={selectedAmenities.includes(amenity)}
                            onChange={() => toggleAmenity(amenity)}
                          />
                          {amenity}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Results */}
                <div className="md:col-span-3 space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {loading
                        ? "Loading..."
                        : `Showing ${hostels.length} results`}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground hidden sm:block">
                        Sort by:
                      </p>
                      <Select value={sortBy} onValueChange={handleSort}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recommended">
                            Recommended
                          </SelectItem>
                          <SelectItem value="price-low">
                            Price: Low to High
                          </SelectItem>
                          <SelectItem value="price-high">
                            Price: High to Low
                          </SelectItem>
                          <SelectItem value="rating">Rating</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                      {error}
                    </div>
                  )}

                  {loading ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="overflow-hidden">
                          <div className="aspect-video w-full bg-muted relative">
                            <Skeleton className="h-full w-full" />
                          </div>
                          <CardHeader className="p-4">
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                          </CardHeader>
                          <CardContent className="p-4 pt-0 space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-4 w-1/4" />
                          </CardContent>
                          <CardFooter className="p-4 pt-0">
                            <Skeleton className="h-10 w-full" />
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : hostels.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-lg text-muted-foreground">
                        No hostels found matching your criteria.
                      </p>
                      {hasActiveFilters && (
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={clearFilters}
                        >
                          Clear filters
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {hostels.map((hostel) => (
                          <HostelCard key={hostel.id} hostel={hostel} />
                        ))}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex justify-center gap-2 pt-2">
                          <Button
                            variant="outline"
                            onClick={() =>
                              setCurrentPage((prev) => Math.max(prev - 1, 1))
                            }
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from(
                              { length: totalPages },
                              (_, i) => i + 1
                            ).map((page) => (
                              <Button
                                key={page}
                                variant={
                                  currentPage === page ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </Button>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            onClick={() =>
                              setCurrentPage((prev) =>
                                Math.min(prev + 1, totalPages)
                              )
                            }
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
