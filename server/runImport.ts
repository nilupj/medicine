import { importDrugsFromList } from './importDrugs';
import { initDatabase } from './database';
import path from 'path';

async function main() {
  try {
    console.log('Initializing database...');
    await initDatabase();
    
    console.log('Starting medicine import...');
    const medicinesFilePath = path.join(process.cwd(), 'server/data/medicines.txt');
    await importDrugsFromList(medicinesFilePath);
    
    console.log('All done! Medicines have been imported to the database.');
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);