import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { db } from './db';
import { medicines, categories, type InsertMedicine, type InsertCategory } from '@shared/schema';
import { eq } from 'drizzle-orm';

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
  const drugs: DrugData[] = [];
  const fileStream = fs.createReadStream(filePath);
  
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let lineCount = 0;
  
  for await (const line of rl) {
    lineCount++;
    
    // Skip the header line
    if (lineCount === 1) continue;
    
    const parts = line.split('|');
    if (parts.length >= 7) {
      const drugData: DrugData = {
        drugCode: parts[0],
        name: parts[1],
        formulation: parts[2],
        strength: parts[3],
        countNumber: parseInt(parts[4], 10) || 0,
        l1Rate: parseFloat(parts[5]) || 0,
        l1Lab: parts[6]
      };
      
      drugs.push(drugData);
    }
  }
  
  return drugs;
}

/**
 * Import drugs from a drug list file
 */
export async function importDrugsFromList(filePath: string): Promise<void> {
  try {
    console.log(`Starting import from ${filePath}...`);
    
    const drugs = await parseDrugListFile(filePath);
    console.log(`Parsed ${drugs.length} drugs from file.`);
    
    // Track categories we've already added
    const addedCategories = new Set<string>();
    
    // Process each drug
    for (const drug of drugs) {
      try {
        // Check if this medicine already exists
        const existingMedicine = await db.select()
          .from(medicines)
          .where(eq(medicines.drugCode, drug.drugCode))
          .limit(1);
          
        if (existingMedicine.length > 0) {
          console.log(`Medicine ${drug.drugCode} already exists. Skipping.`);
          continue;
        }
        
        // Determine category for this drug
        const category = determineCategoryFromDrugName(drug.name);
        
        // Add category if it doesn't exist yet
        if (!addedCategories.has(category)) {
          try {
            // Check if category already exists
            const existingCategory = await db.select()
              .from(categories)
              .where(eq(categories.name, category))
              .limit(1);
              
            if (existingCategory.length === 0) {
              await db.insert(categories).values({
                name: category,
                description: `${category} medications`
              });
              console.log(`Added category: ${category}`);
            }
            
            addedCategories.add(category);
          } catch (error) {
            console.error(`Error adding category ${category}:`, error);
          }
        }
        
        // Get category ID
        const [categoryRecord] = await db.select()
          .from(categories)
          .where(eq(categories.name, category))
          .limit(1);
        
        if (!categoryRecord) {
          console.error(`Could not find category ${category} for drug ${drug.name}`);
          continue;
        }
        
        // Add the medicine
        const medicineData: InsertMedicine = {
          drugCode: drug.drugCode,
          name: drug.name,
          formulation: drug.formulation,
          strength: drug.strength,
          description: `${drug.name} ${drug.formulation} ${drug.strength}`,
          category: categoryRecord.name,
          composition: null,
          sideEffects: null,
          countNumber: drug.countNumber.toString(),
          l1Rate: drug.l1Rate.toString(),
          l1Lab: drug.l1Lab
        };
        
        await db.insert(medicines).values(medicineData);
        console.log(`Added medicine: ${drug.name}`);
      } catch (error) {
        console.error(`Error processing drug ${drug.drugCode} - ${drug.name}:`, error);
      }
    }
    
    console.log('Import complete!');
  } catch (error) {
    console.error('Failed to import drugs:', error);
    throw error;
  }
}

/**
 * Determine a basic category based on drug name
 * This is a simple implementation - in a real system, we'd have more sophisticated categorization
 */
function determineCategoryFromDrugName(name: string): string {
  // Check for specific medication categories
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes('insulin') || nameLower.includes('metformin') || nameLower.includes('glipizide') || nameLower.includes('glyburide')) {
    return 'Diabetes';
  }
  
  if (nameLower.includes('lisinopril') || nameLower.includes('amlodipine') || nameLower.includes('losartan') || 
      nameLower.includes('metoprolol') || nameLower.includes('atenolol') || nameLower.includes('valsartan')) {
    return 'Cardiovascular';
  }
  
  if (nameLower.includes('albuterol') || nameLower.includes('fluticasone') || nameLower.includes('montelukast') || 
      nameLower.includes('budesonide') || nameLower.includes('salbutamol')) {
    return 'Respiratory';
  }
  
  if (nameLower.includes('omeprazole') || nameLower.includes('pantoprazole') || nameLower.includes('ranitidine') || 
      nameLower.includes('famotidine') || nameLower.includes('esomeprazole')) {
    return 'Gastrointestinal';
  }
  
  if (nameLower.includes('amoxicillin') || nameLower.includes('azithromycin') || nameLower.includes('ciprofloxacin') || 
      nameLower.includes('doxycycline') || nameLower.includes('penicillin') || nameLower.includes('cephalexin')) {
    return 'Antibiotics';
  }
  
  if (nameLower.includes('ibuprofen') || nameLower.includes('acetaminophen') || nameLower.includes('naproxen') || 
      nameLower.includes('aspirin') || nameLower.includes('celecoxib')) {
    return 'Pain Relief';
  }
  
  if (nameLower.includes('loratadine') || nameLower.includes('cetirizine') || nameLower.includes('fexofenadine') || 
      nameLower.includes('diphenhydramine') || nameLower.includes('allegra')) {
    return 'Allergy';
  }
  
  if (nameLower.includes('fluoxetine') || nameLower.includes('sertraline') || nameLower.includes('escitalopram') || 
      nameLower.includes('citalopram') || nameLower.includes('paroxetine') || nameLower.includes('zoloft')) {
    return 'Mental Health';
  }
  
  if (nameLower.includes('estradiol') || nameLower.includes('levonorgestrel') || nameLower.includes('norethindrone') || 
      nameLower.includes('progesterone')) {
    return 'Hormone';
  }
  
  // Default category if no matches found
  return 'Other';
}