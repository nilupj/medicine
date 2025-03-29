import { useState } from "react";
import MedicineCard from "./MedicineCard";
import { Medicine } from "@shared/schema";
import { FilterOptions } from "./FilterBar";

interface ResultsSectionProps {
  searchQuery: string;
  searchResults: Medicine[];
  isLoading: boolean;
  isError: boolean;
  filters: FilterOptions;
}

export default function ResultsSection({ 
  searchQuery, 
  searchResults, 
  isLoading, 
  isError,
  filters 
}: ResultsSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 6;
  
  // Apply filters to the search results
  const filterResults = (results: Medicine[]) => {
    let filteredResults = [...results];
    
    // Filter by category
    if (filters.category) {
      filteredResults = filteredResults.filter(medicine => 
        medicine.category.includes(filters.category)
      );
    }
    
    // Filter by form
    if (filters.form) {
      filteredResults = filteredResults.filter(medicine => 
        medicine.forms?.toLowerCase().includes(filters.form.toLowerCase())
      );
    }
    
    // Apply sorting
    if (filters.sort) {
      switch (filters.sort) {
        case 'name_asc':
          filteredResults.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'name_desc':
          filteredResults.sort((a, b) => b.name.localeCompare(a.name));
          break;
        // Add more sorting options as needed
      }
    }
    
    return filteredResults;
  };
  
  const filteredResults = filterResults(searchResults);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const paginatedResults = filteredResults.slice(startIndex, startIndex + resultsPerPage);
  
  // Handle page change
  const goToPage = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // Initial state content
  const renderInitialState = () => (
    <div className="text-center py-8">
      <svg className="mx-auto mb-4 w-60 h-auto" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect x="25" y="30" width="50" height="40" rx="5" fill="#e2e8f0" />
        <rect x="35" y="25" width="30" height="10" rx="2" fill="#94a3b8" />
        <circle cx="50" cy="50" r="15" fill="#cbd5e1" />
        <rect x="40" y="45" width="20" height="2" rx="1" fill="#94a3b8" />
        <rect x="40" y="50" width="20" height="2" rx="1" fill="#94a3b8" />
        <rect x="40" y="55" width="20" height="2" rx="1" fill="#94a3b8" />
      </svg>
      <h3 className="text-xl font-medium text-slate-700 mb-2">Start your search</h3>
      <p className="text-slate-500 mb-4">Enter a medicine name to see detailed information</p>
      <div className="flex flex-wrap justify-center gap-2 mt-6">
        <h4 className="w-full text-slate-600 font-medium mb-2">Popular Searches</h4>
        {['Acetaminophen', 'Ibuprofen', 'Omeprazole', 'Metformin', 'Lisinopril'].map((medicine, index) => (
          <button 
            key={index}
            className="bg-white border border-slate-300 shadow-sm px-3 py-2 rounded-md text-sm hover:bg-slate-50 transition text-slate-700"
          >
            {medicine}
          </button>
        ))}
      </div>
    </div>
  );
  
  // Loading state content
  const renderLoadingState = () => (
    <div className="text-center py-12">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-primary"></div>
      <p className="mt-4 text-slate-600">Searching for medicine information...</p>
    </div>
  );
  
  // No results state content
  const renderNoResultsState = () => (
    <div className="text-center py-8 bg-white rounded-lg shadow-sm p-6">
      <span className="material-icons text-slate-400 text-5xl mb-4">search_off</span>
      <h3 className="text-xl font-medium text-slate-700 mb-2">No results found</h3>
      <p className="text-slate-500 mb-6">
        We couldn't find any medicine matching your search. Try checking the spelling or searching for a different medication.
      </p>
    </div>
  );
  
  // Error state content
  const renderErrorState = () => (
    <div className="text-center py-8 bg-white rounded-lg shadow-sm p-6">
      <span className="material-icons text-error text-5xl mb-4">error_outline</span>
      <h3 className="text-xl font-medium text-slate-700 mb-2">Something went wrong</h3>
      <p className="text-slate-500 mb-4">We're having trouble connecting to our database. Please try again later.</p>
      <button className="mt-2 bg-primary hover:bg-accent text-white px-4 py-2 rounded-md transition-colors duration-200">
        Try Again
      </button>
    </div>
  );
  
  // Results container content
  const renderResultsContainer = () => (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-slate-800">Results for "{searchQuery}"</h3>
        <span className="text-sm text-slate-500">{filteredResults.length} medications found</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedResults.map((medicine) => (
          <MedicineCard key={medicine.id} medicine={medicine} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="inline-flex rounded-md shadow-sm">
            <button 
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-l-md hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`px-3 py-2 text-sm font-medium ${
                  currentPage === page
                    ? "text-white bg-primary border border-primary"
                    : "text-slate-500 bg-white border border-slate-300 hover:bg-slate-50"
                }`}
              >
                {page}
              </button>
            ))}
            
            <button 
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-r-md hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
  
  // Determine which state to render
  const renderContent = () => {
    if (!searchQuery) {
      return renderInitialState();
    }
    
    if (isLoading) {
      return renderLoadingState();
    }
    
    if (isError) {
      return renderErrorState();
    }
    
    if (filteredResults.length === 0) {
      return renderNoResultsState();
    }
    
    return renderResultsContainer();
  };
  
  return (
    <section>
      {renderContent()}
    </section>
  );
}
