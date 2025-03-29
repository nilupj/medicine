import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { RecentSearch } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface SearchSectionProps {
  onSearch: (query: string) => void;
}

export default function SearchSection({ onSearch }: SearchSectionProps) {
  const [searchInput, setSearchInput] = useState("");
  const [isShowingSuggestions, setIsShowingSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch recent searches
  const { data: recentSearches = [] } = useQuery<RecentSearch[]>({
    queryKey: ["/api/recent-searches"],
  });
  
  // Fetch suggestions based on input
  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: [
      `/api/medicines/search/${searchInput}`, 
      { limit: 5 }
    ],
    enabled: searchInput.length >= 2,
  });

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    if (e.target.value.length >= 2) {
      setIsShowingSuggestions(true);
    } else {
      setIsShowingSuggestions(false);
    }
  };

  const handleSearchSubmit = () => {
    if (searchInput.trim().length < 2) {
      toast({
        title: "Search query too short",
        description: "Please enter at least 2 characters to search",
        variant: "destructive",
      });
      return;
    }
    
    onSearch(searchInput);
    setIsShowingSuggestions(false);
  };

  const handleSuggestionClick = (medicineName: string) => {
    setSearchInput(medicineName);
    onSearch(medicineName);
    setIsShowingSuggestions(false);
  };

  const handleRecentSearchClick = (searchTerm: string) => {
    setSearchInput(searchTerm);
    onSearch(searchTerm);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsShowingSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  return (
    <section className="mb-10 text-center">
      <h2 className="text-2xl md:text-3xl font-semibold text-slate-800 mb-4">Find Medicine Information</h2>
      <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
        Search for any medication to discover its purpose, usage, and other important details to make informed health decisions.
      </p>
      
      <div className="max-w-2xl mx-auto relative">
        <div className="flex items-center relative">
          <span className="material-icons absolute left-4 text-slate-400">search</span>
          <input 
            ref={inputRef}
            type="text" 
            id="medicineSearch" 
            placeholder="Enter medicine name..." 
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
            value={searchInput}
            onChange={handleSearchInput}
            onKeyDown={handleKeyDown}
            onFocus={() => searchInput.length >= 2 && setIsShowingSuggestions(true)}
          />
          <button 
            className="absolute right-2 bg-primary hover:bg-accent text-white px-4 py-2 rounded-md transition-colors duration-200"
            onClick={handleSearchSubmit}
          >
            Search
          </button>
        </div>

        {isShowingSuggestions && (
          <div 
            ref={suggestionsRef}
            className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-slate-200 text-left"
          >
            {suggestionsLoading ? (
              <div className="px-4 py-2 text-slate-500">
                Loading suggestions...
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion) => (
                <div 
                  key={suggestion.id}
                  className="px-4 py-2 hover:bg-slate-100 cursor-pointer border-b border-slate-100 flex items-center"
                  onClick={() => handleSuggestionClick(suggestion.name)}
                >
                  <span className="material-icons text-slate-400 mr-2">medication</span>
                  <span>{suggestion.name}</span>
                </div>
              ))
            ) : searchInput.length >= 2 ? (
              <div className="px-4 py-2 text-slate-500">
                No suggestions found
              </div>
            ) : null}
          </div>
        )}

        {/* Recent searches */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {recentSearches.length > 0 && (
            <>
              <span className="text-sm text-slate-500 self-center">Recent:</span>
              {recentSearches.map((search, index) => (
                <button 
                  key={index}
                  className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-sm hover:bg-slate-300 transition"
                  onClick={() => handleRecentSearchClick(search.searchTerm)}
                >
                  {search.searchTerm}
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
