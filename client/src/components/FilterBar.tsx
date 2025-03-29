import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Category } from "@shared/schema";

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
}

export interface FilterOptions {
  category: string;
  form: string;
  sort: string;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    category: "",
    form: "",
    sort: "",
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Predefined medicine forms
  const medicineForms = [
    { value: "tablet", label: "Tablet" },
    { value: "capsule", label: "Capsule" },
    { value: "liquid", label: "Liquid" },
    { value: "injection", label: "Injection" },
    { value: "topical", label: "Topical" },
  ];

  // Predefined sort options
  const sortOptions = [
    { value: "name_asc", label: "Name (A-Z)" },
    { value: "name_desc", label: "Name (Z-A)" },
    { value: "popular", label: "Most Popular" },
  ];

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <section className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="mb-4 md:mb-0">
          <h3 className="font-medium text-slate-700">Filter Results</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <select 
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
          
          <select 
            name="form"
            value={filters.form}
            onChange={handleFilterChange}
            className="bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Forms</option>
            {medicineForms.map((form) => (
              <option key={form.value} value={form.value}>
                {form.label}
              </option>
            ))}
          </select>
          
          <select 
            name="sort"
            value={filters.sort}
            onChange={handleFilterChange}
            className="bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Sort By</option>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
