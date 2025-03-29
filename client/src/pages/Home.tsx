import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchSection from "@/components/SearchSection";
import FilterBar, { FilterOptions } from "@/components/FilterBar";
import ResultsSection from "@/components/ResultsSection";
import { Medicine } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    category: "",
    form: "",
    sort: "",
  });

  // Query for search results
  const {
    data: searchResults = [],
    isLoading,
    isError,
    refetch
  } = useQuery<Medicine[]>({
    queryKey: [`/api/medicines/search/${searchQuery}`, { limit: 50 }],
    enabled: searchQuery.length >= 2,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <SearchSection onSearch={handleSearch} />
        
        {searchQuery && searchResults.length > 0 && (
          <FilterBar onFilterChange={handleFilterChange} />
        )}
        
        <ResultsSection 
          searchQuery={searchQuery}
          searchResults={searchResults}
          isLoading={isLoading}
          isError={isError}
          filters={filters}
        />
      </main>
      
      <Footer />
    </div>
  );
}
