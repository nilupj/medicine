import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

async function cleanMedicines() {
  try {
    const inputFilePath = path.join(process.cwd(), 'server/data/druglist.txt');
    const outputFilePath = path.join(process.cwd(), 'server/data/medicines.txt');
    
    const fileStream = fs.createReadStream(inputFilePath);
    const outputStream = fs.createWriteStream(outputFilePath);
    
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });
    
    // Write the header
    outputStream.write('DrugCode|Name|Formulation|Strength|Count|L1Rate|L1Lab\n');
    
    let lineCount = 0;
    let medicineCount = 0;
    
    const menuItems = [
      'Drugs', 'Tools', 'Privacy', 'RxList', 'Advertising', 
      'Generic', 'Vitamins', 'Drug Interaction', 'Pill', 
      'Medical', 'Slideshows', 'Images', 'Quizzes',
      'A-Z', 'Contact', 'Terms', 'About'
    ];
    
    for await (const line of rl) {
      lineCount++;
      
      // Skip the header line (first line)
      if (lineCount === 1) {
        continue;
      }
      
      // Parse the line
      const parts = line.split('|');
      if (parts.length < 2) continue;
      
      const drugCode = parts[0];
      const name = parts[1];
      
      // Skip menu items and other non-medicines
      let isMenuOrNavItem = false;
      for (const menuItem of menuItems) {
        if (name.includes(menuItem)) {
          isMenuOrNavItem = true;
          break;
        }
      }
      
      if (isMenuOrNavItem) {
        continue;
      }
      
      // This is a genuine medicine
      outputStream.write(`${line}\n`);
      medicineCount++;
    }
    
    outputStream.end();
    console.log(`Cleaning complete. ${medicineCount} medicines written to ${outputFilePath}`);
  } catch (error) {
    console.error('Error cleaning medicines:', error);
  }
}

// Run the cleaning process
cleanMedicines().catch(console.error);