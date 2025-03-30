import * as fs from 'fs';
import * as readline from 'readline';
import { storage } from './storage';
import { InsertMedicine } from '@shared/schema';

interface DrugData {
  drugCode: string;
  name: string;
  formulation: string;
  strength: string;
  countNumber: number;
  l1Rate: number;
  l1Lab: string;
}

/**
 * Parse the drug list file and extract drug data
 */
async function parseDrugListFile(filePath: string): Promise<DrugData[]> {
  const drugList: DrugData[] = [];

  // Create read interface for file
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let isFirstLine = true;
  
  // Process each line
  for await (const line of rl) {
    // Skip header line
    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }

    // Parse pipe-delimited data
    const parts = line.split('|');
    if (parts.length < 7) {
      console.warn(`Invalid line format, skipping: ${line}`);
      continue;
    }

    try {
      const drugData: DrugData = {
        drugCode: parts[0].trim(),
        name: parts[1].trim(),
        formulation: parts[2].trim(),
        strength: parts[3].trim(),
        countNumber: parseInt(parts[4].trim(), 10),
        l1Rate: parseFloat(parts[5].trim()),
        l1Lab: parts[6].trim(),
      };

      drugList.push(drugData);
    } catch (error) {
      console.error(`Error parsing line: ${line}`, error);
    }
  }

  return drugList;
}

/**
 * Import drugs from a drug list file
 */
export async function importDrugsFromList(filePath: string): Promise<void> {
  try {
    console.log(`Starting import from file: ${filePath}`);
    
    // Parse the drug list file
    const drugList = await parseDrugListFile(filePath);
    console.log(`Found ${drugList.length} drugs to import`);
    
    // Process and import each drug
    let successCount = 0;
    let errorCount = 0;
    
    for (const drug of drugList) {
      try {
        // Check if medicine with this drug code already exists
        const existingMedicine = await storage.getMedicineByDrugCode(drug.drugCode);
        
        if (existingMedicine) {
          console.log(`Updating existing drug: ${drug.name} (${drug.drugCode})`);
          
          // Update the existing medicine record
          // This would require adding an updateMedicine method to the storage interface
        } else {
          console.log(`Adding new drug: ${drug.name} (${drug.drugCode})`);
          
          // Prepare data for insertion
          const medicineData: InsertMedicine = {
            name: drug.name,
            description: `${drug.name} ${drug.formulation} ${drug.strength}`,
            category: determineCategoryFromDrugName(drug.name),
            forms: drug.formulation,
            drugCode: drug.drugCode,
            formulation: drug.formulation,
            strength: drug.strength,
            countNumber: drug.countNumber,
            l1Rate: drug.l1Rate.toString(),
            l1Lab: drug.l1Lab,
            // These fields are required but might not be in the import file
            // Use sensible defaults or inferred values
            aliases: null,
            composition: null,
            uses: `${drug.name} is used for medical conditions requiring ${determineCategoryFromDrugName(drug.name)} treatment.`,
            sideEffects: null,
            dosage: `${drug.strength} as directed by healthcare provider.`,
            warnings: null,
            otcRx: 'Rx' // Assume all imported drugs are prescription
          };
          
          // Insert the new medicine
          await storage.createMedicine(medicineData);
          successCount++;
        }
      } catch (error) {
        console.error(`Error importing drug ${drug.drugCode}:`, error);
        errorCount++;
      }
    }
    
    console.log(`Import completed. Added ${successCount} new drugs. Errors: ${errorCount}`);
  } catch (error) {
    console.error('Error during drug import process:', error);
    throw error;
  }
}

/**
 * Determine a basic category based on drug name
 * This is a simple implementation - in a real system, we'd have more sophisticated categorization
 */
function determineCategoryFromDrugName(name: string): string {
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes('paracetamol') || nameLower.includes('acetaminophen')) {
    return 'Pain Relief';
  } else if (nameLower.includes('ibuprofen') || nameLower.includes('naproxen')) {
    return 'NSAIDS';
  } else if (nameLower.includes('amoxicillin') || nameLower.includes('ciprofloxacin') || 
             nameLower.includes('metronidazole')) {
    return 'Antibacterials';
  } else if (nameLower.includes('albuterol') || nameLower.includes('salbutamol')) {
    return 'Respiratory';
  } else if (nameLower.includes('omeprazole')) {
    return 'Gastrointestinal';
  } else if (nameLower.includes('losartan') || nameLower.includes('atorvastatin')) {
    return 'Cardiovascular';
  } else if (nameLower.includes('metformin') || nameLower.includes('insulin')) {
    return 'Diabetes';
  } else if (nameLower.includes('diazepam') || nameLower.includes('levetiracetam')) {
    return 'Neurological';
  }
  
  return 'Other';
}