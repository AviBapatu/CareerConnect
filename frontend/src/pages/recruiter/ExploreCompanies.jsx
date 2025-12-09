import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import CompanyCard from "@/components/CompanyCard";
import { CompanyGridSkeleton } from "@/components/CompanyCardSkeleton";
import useCompanyFiltersStore from "@/store/companyFiltersStore";
import { getAllCompanies, getFilterOptions } from "@/api/companyApi";
import {
  Building2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  X,
  Briefcase,
  MapPin,
  Users,
  Calendar,
} from "lucide-react";

const ExploreCompanies = ({ userRole = "recruiter" }) => {
  const navigate = useNavigate();
  const {
    searchQuery,
    selectedIndustries,
    selectedLocations,
    selectedSizes,
    sortBy,
    hasJobs,
    currentPage,
    availableIndustries,
    availableLocations,
    availableSizes,
    setSearchQuery,
    toggleIndustry,
    toggleLocation,
    toggleSize,
    setSortBy,
    setHasJobs,
    setCurrentPage,
    clearAllFilters,
    getQueryParams,
    setAvailableIndustries,
    setAvailableLocations,
  } = useCompanyFiltersStore();

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [openSections, setOpenSections] = useState({
    industry: true,
    location: true,
    size: true,
  });

  // Fetch filter options
  const { data: filterOptions } = useQuery({
    queryKey: ["filterOptions"],
    queryFn: getFilterOptions,
    staleTime: 5 * 60 * 1000,
    onSuccess: (data) => {
      if (data?.success && data?.options) {
        setAvailableIndustries(data.options.industries || []);
        setAvailableLocations(data.options.locations || []);
      }
    },
  });

  // Fetch companies
  const {
    data: companiesData,
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["companies", getQueryParams()],
    queryFn: () => getAllCompanies(getQueryParams()),
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000,
  });

  const companies = companiesData?.companies || [];
  const pagination = companiesData?.pagination || {};

  const sortOptions = [
    { value: "name_asc", label: "Company Name (A-Z)", icon: Calendar },
    { value: "name_desc", label: "Company Name (Z-A)", icon: Calendar },
    { value: "newest", label: "Newest First", icon: Calendar },
    { value: "oldest", label: "Oldest First", icon: Calendar },
    { value: "most_jobs", label: "Most Jobs", icon: Briefcase },
  ];

  const handleViewJobs = (company) => {
    
    const route =
      userRole === "candidate"
        ? `/candidate/company/${company._id}/jobs`
        : `/recruiter/company/${company._id}/jobs`;
    navigate(route);
  };

  const handleViewDetails = (company) => {
    
    const route =
      userRole === "candidate"
        ? `/candidate/company/${company._id}`
        : `/recruiter/company/${company._id}`;
    navigate(route);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getActiveFilterCount = () => {
    return (
      selectedIndustries.length +
      selectedLocations.length +
      selectedSizes.length +
      (hasJobs ? 1 : 0)
    );
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Clean Filter Section Component
  const FilterSection = ({
    title,
    icon: Icon,
    items,
    selectedItems,
    onToggle,
    section,
    maxShow = 5,
  }) => {
    const [showAll, setShowAll] = useState(false);
    const displayItems = showAll ? items : items.slice(0, maxShow);
    const hasMore = items.length > maxShow;

    return (
      <div className="space-y-2">
        <Collapsible
          open={openSections[section]}
          onOpenChange={() => toggleSection(section)}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto text-sm font-medium text-gray-900 hover:text-gray-700"
            >
              <div className="flex items-center space-x-2">
                <Icon className="h-4 w-4 text-gray-600" />
                <span>{title}</span>
                {selectedItems.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 h-4 text-xs bg-gray-100 text-gray-700"
                  >
                    {selectedItems.length}
                  </Badge>
                )}
              </div>
              <ChevronDown
                className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                  openSections[section] ? "rotate-180" : ""
                }`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-2">
            {displayItems.map((item) => (
              <div key={item} className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  id={`${section}-${item}`}
                  checked={selectedItems.includes(item)}
                  onChange={() => onToggle(item)}
                  className="h-3 w-3 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                />
                <Label
                  htmlFor={`${section}-${item}`}
                  className="text-xs text-gray-700 cursor-pointer flex-1 hover:text-gray-900"
                >
                  {item}
                </Label>
              </div>
            ))}
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-500 hover:text-gray-700 p-0 h-auto mt-1"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Show less" : `Show ${items.length - maxShow} more`}
              </Button>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  // Company Size Filter Section as radio buttons
  const CompanySizeFilterSection = ({
    title,
    icon: Icon,
    items,
    selectedItem,
    onSelect,
    section,
  }) => (
    <div className="space-y-2">
      <Collapsible
        open={openSections[section]}
        onOpenChange={() => toggleSection(section)}
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-0 h-auto text-sm font-medium text-gray-900 hover:text-gray-700"
          >
            <div className="flex items-center space-x-2">
              <Icon className="h-4 w-4 text-gray-600" />
              <span>{title}</span>
              {selectedItem && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-4 text-xs bg-gray-100 text-gray-700"
                >
                  {selectedItem}
                </Badge>
              )}
            </div>
            <ChevronDown
              className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                openSections[section] ? "rotate-180" : ""
              }`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 mt-2">
          {items.map((item) => (
            <div key={item} className="flex items-center space-x-2 py-1">
              <input
                type="radio"
                id={`${section}-${item}`}
                checked={selectedItem === item}
                onChange={() => onSelect(item)}
                className="h-3 w-3 text-gray-600 focus:ring-gray-500 border-gray-300 rounded-full"
                name="company-size-radio"
              />
              <Label
                htmlFor={`${section}-${item}`}
                className="text-xs text-gray-700 cursor-pointer flex-1 hover:text-gray-900"
              >
                {item}
              </Label>
            </div>
          ))}
          {/* Add clear option for radio selection */}
          {selectedItem && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-500 hover:text-gray-700 p-0 h-auto mt-1"
              onClick={() => onSelect("")}
            >
              Clear selection
            </Button>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  // Clean Filters Panel Component
  const FiltersPanel = ({ className = "" }) => (
    <Card className={`border border-gray-200 bg-white ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center space-x-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-600" />
            <span>Filters</span>
            {getActiveFilterCount() > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 h-5 bg-gray-100 text-gray-700 text-xs"
              >
                {getActiveFilterCount()}
              </Badge>
            )}
          </CardTitle>
          {getActiveFilterCount() > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Has Jobs Toggle */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-2">
            <Briefcase className="h-4 w-4 text-gray-600" />
            <Label htmlFor="has-jobs" className="text-sm cursor-pointer">
              Has open positions
            </Label>
          </div>
          <Switch
            id="has-jobs"
            checked={hasJobs}
            onCheckedChange={setHasJobs}
          />
        </div>

        <Separator />

        {/* Industry Filter */}
        {availableIndustries.length > 0 && (
          <>
            <FilterSection
              title="Industry"
              icon={Building2}
              items={availableIndustries}
              selectedItems={selectedIndustries}
              onToggle={toggleIndustry}
              section="industry"
            />
            <Separator />
          </>
        )}

        {/* Location Filter */}
        {availableLocations.length > 0 && (
          <>
            <FilterSection
              title="Location"
              icon={MapPin}
              items={availableLocations}
              selectedItems={selectedLocations}
              onToggle={toggleLocation}
              section="location"
            />
            <Separator />
          </>
        )}

        {/* Company Size Filter as radio buttons */}
        <CompanySizeFilterSection
          title="Company Size"
          icon={Users}
          items={availableSizes}
          selectedItem={selectedSizes[0] || ""}
          onSelect={(size) => {
            // Only one selection allowed, clear previous selection
            if (selectedSizes[0] === size) {
              // Deselect if same size clicked
              toggleSize(size);
            } else {
              // Remove all previous selections, then select new
              selectedSizes.forEach((s) => toggleSize(s));
              if (size) toggleSize(size);
            }
          }}
          section="size"
        />
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20">
        <div className="container mx-auto px-6 py-8">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load companies. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Modern Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-gray-900 rounded-xl">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Explore Companies
              </h1>
              <p className="text-sm text-gray-600">
                Discover amazing companies and find your next{" "}
                {userRole === "candidate"
                  ? "career opportunity"
                  : "business partnership"}
              </p>
            </div>
          </div>

          {/* Clean Search and Controls Bar */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Clean Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search companies by name, industry, or location..."
                  className="pl-10 pr-4 h-10 text-sm border border-gray-200 bg-white focus:border-gray-400 focus:ring-0 rounded-lg transition-colors"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 rounded"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                {/* Mobile Filters Button */}
                <Sheet
                  open={showMobileFilters}
                  onOpenChange={setShowMobileFilters}
                >
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="lg:hidden border-gray-200 hover:border-gray-300 text-sm"
                    >
                      <Filter className="h-4 w-4 mr-2 text-gray-600" />
                      Filters
                      {getActiveFilterCount() > 0 && (
                        <Badge className="ml-2 bg-gray-900 text-white text-xs px-1.5 py-0.5 rounded-full">
                          {getActiveFilterCount()}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 bg-white">
                    <SheetHeader className="pb-4 border-b border-gray-200">
                      <SheetTitle className="text-lg font-medium text-gray-900">
                        Filters
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FiltersPanel />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Clean Sort Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-200 hover:border-gray-300 text-sm"
                    >
                      <ArrowUpDown className="h-4 w-4 mr-2 text-gray-600" />
                      <span className="hidden sm:inline">Sort</span>
                      <ChevronDown className="h-4 w-4 ml-2 text-gray-600" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {sortOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => setSortBy(option.value)}
                        className={`cursor-pointer text-sm ${
                          sortBy === option.value
                            ? "bg-gray-50 text-gray-900"
                            : "text-gray-700"
                        }`}
                      >
                        <option.icon className="h-4 w-4 mr-2 text-gray-600" />
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Active Filters Pills */}
            {getActiveFilterCount() > 0 && (
              <div className="flex flex-wrap gap-2 items-center mt-4">
                <span className="text-xs text-gray-500">Active filters:</span>
                {selectedIndustries.map((industry) => (
                  <Badge
                    key={industry}
                    variant="secondary"
                    className="cursor-pointer hover:bg-gray-200 transition-colors text-xs px-2 py-1"
                    onClick={() => toggleIndustry(industry)}
                  >
                    {industry} <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
                {selectedLocations.map((location) => (
                  <Badge
                    key={location}
                    variant="secondary"
                    className="cursor-pointer hover:bg-gray-200 transition-colors text-xs px-2 py-1"
                    onClick={() => toggleLocation(location)}
                  >
                    {location} <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
                {selectedSizes.map((size) => (
                  <Badge
                    key={size}
                    variant="secondary"
                    className="cursor-pointer hover:bg-gray-200 transition-colors text-xs px-2 py-1"
                    onClick={() => toggleSize(size)}
                  >
                    {size} employees <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
                {hasJobs && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-gray-200 transition-colors text-xs px-2 py-1"
                    onClick={() => setHasJobs(false)}
                  >
                    Has Jobs <X className="h-3 w-3 ml-1" />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 h-auto text-xs px-2 py-1"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex gap-6">
          {/* Companies Content */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-medium text-gray-900">
                  {isLoading ? (
                    <Skeleton className="h-6 w-32" />
                  ) : (
                    <>
                      {pagination.totalCompanies?.toLocaleString() || 0}{" "}
                      Companies
                      {searchQuery && ` matching "${searchQuery}"`}
                    </>
                  )}
                </h2>
                {isFetching && !isLoading && (
                  <div className="flex items-center space-x-2 px-2 py-1 bg-gray-50 rounded">
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-400 border-t-transparent"></div>
                    <span className="text-xs text-gray-600">Updating...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Companies Grid */}
            {isLoading ? (
              <CompanyGridSkeleton count={12} />
            ) : companies.length === 0 ? (
              /* Clean Empty State */
              <Card className="border border-gray-200 bg-white p-8 text-center">
                <div className="flex flex-col items-center space-y-4 max-w-sm mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Companies Found
                    </h3>
                    <p className="text-sm text-gray-600">
                      {getActiveFilterCount() > 0
                        ? "No companies match your current filters. Try adjusting your search criteria."
                        : "We couldn't find any companies at the moment. Try searching for something specific."}
                    </p>
                  </div>
                  {getActiveFilterCount() > 0 && (
                    <Button
                      onClick={clearAllFilters}
                      className="bg-gray-900 hover:bg-gray-800 text-white text-sm px-4 py-2"
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <>
                {/* Clean Companies Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8 overflow-hidden">
                  {companies.map((company) => (
                    <CompanyCard
                      key={company._id}
                      company={company}
                      onViewJobs={handleViewJobs}
                      onViewDetails={handleViewDetails}
                      className="transition-shadow duration-200 hover:shadow-md overflow-hidden max-w-full"
                      nameClassName="truncate block whitespace-nowrap overflow-hidden max-w-full"
                      style={{ textOverflow: "ellipsis" }}
                    />
                  ))}
                </div>

                {/* Clean Pagination */}
                {pagination.total > 1 && (
                  <Card className="border border-gray-200 bg-white p-4">
                    <div className="flex justify-center items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!pagination.hasPrev || isFetching}
                        className="border-gray-200 hover:border-gray-300 text-sm"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>

                      <div className="flex items-center space-x-1">
                        {Array.from(
                          { length: Math.min(5, pagination.total) },
                          (_, i) => {
                            const pageNum =
                              currentPage <= 3
                                ? i + 1
                                : currentPage >= pagination.total - 2
                                ? pagination.total - 4 + i
                                : currentPage - 2 + i;

                            if (pageNum < 1 || pageNum > pagination.total)
                              return null;

                            return (
                              <Button
                                key={pageNum}
                                variant={
                                  pageNum === currentPage
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                                disabled={isFetching}
                                className={`w-8 h-8 text-sm ${
                                  pageNum === currentPage
                                    ? "bg-gray-900 text-white hover:bg-gray-800"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                {pageNum}
                              </Button>
                            );
                          }
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!pagination.hasNext || isFetching}
                        className="border-gray-200 hover:border-gray-300 text-sm"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>

                    {/* Pagination Info */}
                    <div className="text-center mt-3 text-xs text-gray-500">
                      Showing {(currentPage - 1) * (pagination.limit || 12) + 1}{" "}
                      to{" "}
                      {Math.min(
                        currentPage * (pagination.limit || 12),
                        pagination.totalCompanies || 0
                      )}{" "}
                      of {pagination.totalCompanies?.toLocaleString() || 0}{" "}
                      companies
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Right Filters Sidebar */}
          <div className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-6">
              <FiltersPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreCompanies;
