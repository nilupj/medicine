import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function extractMedicines() {
  try {
    const inputFilePath = path.join(process.cwd(), 'attached_assets/medicine.txt');
    const outputFilePath = path.join(process.cwd(), 'server/data/druglist.txt');

    const fileStream = fs.createReadStream(inputFilePath);
    const outputStream = fs.createWriteStream(outputFilePath);
    
    // Write header line
    outputStream.write('DrugCode|Name|Formulation|Strength|Count|L1Rate|L1Lab\n');
    
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let drugCode = 1000;
    let inDrugList = false;
    let currentLetter = '';
    
    for await (const line of rl) {
      // Skip empty lines
      if (!line.trim()) continue;
      
      // Check if we're in a drug list section
      if (line.match(/^A[A-Z][a-z]-[A-Z][a-z]$/) || line.match(/^[A-Z][a-z]-[A-Z][a-z]$/)) {
        inDrugList = true;
        currentLetter = line[0];
        console.log(`Found drug list section: ${line}`);
        continue;
      }
      
      // Skip headers and menu items
      if (line.match(/^(Drugs|Tools|Privacy|RxList|Advertising|Generic|Vitamins|Drug Interaction|Pill|Medical|Slideshows|Images|Quizzes)/)) {
        continue;
      }
      
      // Single letter entries are not medicines
      if (line.trim().match(/^[A-Z]$/)) {
        continue;
      }
      
      if (line.startsWith('    ') && line.length > 10) {
        // This is a medicine line
        let medicineLine = line.trim();
        
        // Extract the medicine name and any parenthetical information
        const nameMatch = medicineLine.match(/^(.+?)(?:\s+\((.+)\))?$/);
        if (!nameMatch) continue;
        
        const name = nameMatch[1].trim();
        // Skip menu items and headers
        if (name.match(/^(Drugs|Tools|Privacy|Contact|Terms|About|Advertising)/)) {
          continue;
        }
        
        const parentheticalInfo = nameMatch[2] ? nameMatch[2].trim() : '';
        
        // Use parenthetical info to determine formulation and strength when available
        let formulation = determineFormulation(parentheticalInfo);
        if (formulation === 'Unknown') {
          formulation = determineFormulation(name);
        }
        
        let strength = determineStrength(parentheticalInfo);
        if (strength === 'Unknown') {
          strength = determineStrength(name);
          if (strength === 'Unknown') {
            // Default to a common strength if we couldn't determine it
            strength = '100mg';
          }
        }
        
        if (formulation === 'Unknown') {
          // Default to tablet if we couldn't determine formulation
          formulation = 'Tablet';
        }
        
        // Generate reasonable values for other fields
        const count = Math.floor(Math.random() * 90) + 10; // 10-100 count
        const l1Rate = (Math.random() * 900 + 100).toFixed(2); // $100-$1000 price
        const l1Lab = "MED" + drugCode;
        
        // Write the medicine entry
        outputStream.write(`MED${drugCode}|${name}|${formulation}|${strength}|${count}|${l1Rate}|${l1Lab}\n`);
        drugCode++;
      }
    }
    
    outputStream.end();
    console.log(`Extraction complete. Medicines written to ${outputFilePath}`);
  } catch (error) {
    console.error('Error extracting medicines:', error);
  }
}

function determineFormulation(name: string): string {
  if (!name) return 'Unknown';
  
  // Try to determine formulation from name
  const lowerName = name.toLowerCase();
  if (lowerName.includes('tablet')) return 'Tablet';
  if (lowerName.includes('capsule')) return 'Capsule';
  if (lowerName.includes('injection') || lowerName.includes('injectable')) return 'Injection';
  if (lowerName.includes('cream')) return 'Cream';
  if (lowerName.includes('ointment')) return 'Ointment';
  if (lowerName.includes('syrup')) return 'Syrup';
  if (lowerName.includes('solution')) return 'Solution';
  if (lowerName.includes('suspension')) return 'Suspension';
  if (lowerName.includes('powder')) return 'Powder';
  if (lowerName.includes('drops')) return 'Drops';
  if (lowerName.includes('lotion')) return 'Lotion';
  if (lowerName.includes('patch')) return 'Patch';
  if (lowerName.includes('film')) return 'Film';
  
  // If can't determine, use Tablet as a default formulation
  return 'Unknown';
}

function determineStrength(name: string): string {
  if (!name) return 'Unknown';
  
  // Try to extract strength from name using regex for common patterns
  const strengthMatch = name.match(/\b\d+(\.\d+)?\s*(mg|g|mcg|ml|%)\b/i);
  if (strengthMatch) {
    return strengthMatch[0];
  }
  
  // If can't determine, return Unknown
  return 'Unknown';
}

// Run the extraction
extractMedicines().catch(console.error);