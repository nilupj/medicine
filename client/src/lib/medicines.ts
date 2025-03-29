import { Medicine } from "@shared/schema";

/**
 * Formats medicine data for display
 */
export function formatMedicineData(medicine: Medicine) {
  return {
    ...medicine,
    categories: medicine.category.split(',').map(c => c.trim()),
    usesList: medicine.uses?.split('\n') || [],
    sideEffectsList: medicine.sideEffects?.split('\n') || [],
    formattedDate: formatDate(medicine.lastUpdated)
  };
}

/**
 * Formats a date for display
 */
export function formatDate(date: Date): string {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  });
}

/**
 * Filter medicines based on category, form, etc.
 */
export function filterMedicines(
  medicines: Medicine[], 
  filters: { category?: string; form?: string; }
): Medicine[] {
  return medicines.filter(medicine => {
    // Category filter
    if (filters.category && !medicine.category.includes(filters.category)) {
      return false;
    }
    
    // Form filter
    if (filters.form && (!medicine.forms || !medicine.forms.toLowerCase().includes(filters.form.toLowerCase()))) {
      return false;
    }
    
    return true;
  });
}

/**
 * Sort medicines by different criteria
 */
export function sortMedicines(
  medicines: Medicine[], 
  sortBy: string
): Medicine[] {
  const sortedMedicines = [...medicines];
  
  switch (sortBy) {
    case 'name_asc':
      return sortedMedicines.sort((a, b) => a.name.localeCompare(b.name));
    case 'name_desc':
      return sortedMedicines.sort((a, b) => b.name.localeCompare(a.name));
    default:
      return sortedMedicines;
  }
}
