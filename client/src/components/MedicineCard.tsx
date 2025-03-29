import { useState } from "react";
import { Medicine } from "@shared/schema";
import { Check } from "lucide-react";

interface MedicineCardProps {
  medicine: Medicine;
  onSelect?: (medicine: Medicine) => void;
  isSelected?: boolean;
  selectable?: boolean;
}

export default function MedicineCard({ 
  medicine, 
  onSelect, 
  isSelected = false, 
  selectable = false 
}: MedicineCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleDetails = (e: React.MouseEvent) => {
    if (selectable) {
      e.stopPropagation();
    }
    setIsExpanded(!isExpanded);
  };
  
  const handleSelect = () => {
    if (selectable && onSelect) {
      onSelect(medicine);
    }
  };

  // Format date for display
  const formatDate = (dateString: Date | null) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  // Split categories and tags
  const categories = medicine.category?.split(',').map(c => c.trim()) || [];
  
  // Split uses and side effects into arrays for list display
  const usesList = medicine.uses?.split('\n') || [];
  const sideEffectsList = medicine.sideEffects?.split('\n') || [];

  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden border ${isSelected ? 'border-primary border-2' : 'border-slate-200'} hover:shadow-md transition ${selectable ? 'cursor-pointer' : ''}`}
         onClick={selectable ? handleSelect : undefined}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            {selectable && (
              <div className={`w-5 h-5 flex items-center justify-center rounded mr-2 ${isSelected ? 'bg-primary text-white' : 'border border-slate-300'}`}>
                {isSelected && <Check className="h-3 w-3" />}
              </div>
            )}
            <h4 className="font-semibold text-lg text-slate-800">{medicine.name}</h4>
          </div>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {medicine.otcRx}
          </span>
        </div>
        
        {medicine.aliases && (
          <div className="text-sm text-slate-500 mb-3">
            Also known as: {medicine.aliases}
          </div>
        )}
        
        <div className="flex gap-2 mb-3 flex-wrap">
          {categories.map((category, index) => (
            <span 
              key={index} 
              className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full"
            >
              {category}
            </span>
          ))}
        </div>
        
        <p className="text-slate-700 mb-4">{medicine.description}</p>
        
        <div className="mt-2">
          <button 
            className="text-primary hover:text-accent text-sm font-medium flex items-center transition-colors"
            onClick={toggleDetails}
          >
            <span>{isExpanded ? 'See less details' : 'See more details'}</span>
            <span className="material-icons text-sm ml-1">
              {isExpanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>
        
        <div className={`border-t border-slate-100 mt-4 pt-4 ${isExpanded ? '' : 'hidden'}`}>
          {usesList.length > 0 && (
            <div className="mb-3">
              <h5 className="font-medium text-slate-700 mb-1">Common Uses</h5>
              <ul className="list-disc list-inside text-sm text-slate-600">
                {usesList.map((use, index) => (
                  <li key={index}>{use}</li>
                ))}
              </ul>
            </div>
          )}
          
          {sideEffectsList.length > 0 && (
            <div className="mb-3">
              <h5 className="font-medium text-slate-700 mb-1">Common Side Effects</h5>
              <ul className="list-disc list-inside text-sm text-slate-600">
                {sideEffectsList.map((effect, index) => (
                  <li key={index}>{effect}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="text-xs text-slate-500 mt-2">
            {medicine.composition && <p className="mb-1"><span className="font-medium">Active ingredients:</span> {medicine.composition}</p>}
            {medicine.forms && <p>Available forms: {medicine.forms}</p>}
            {medicine.dosage && <p>Typical dosage: {medicine.dosage}</p>}
          </div>
          
          {medicine.warnings && (
            <div className="bg-yellow-50 p-3 rounded-md mt-3">
              <div className="flex items-start">
                <span className="material-icons text-warning mr-2 text-lg">warning</span>
                <div className="text-xs text-slate-700">
                  <p className="font-medium">Warning</p>
                  <p>{medicine.warnings}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-slate-50 px-4 py-3 flex justify-between items-center">
        <span className="text-xs text-slate-500">
          Last updated: {formatDate(medicine.lastUpdated)}
        </span>
        <button className="text-sm text-primary hover:text-accent font-medium">
          <span className="material-icons text-sm">bookmark_border</span>
          <span className="sr-only">Save</span>
        </button>
      </div>
    </div>
  );
}
