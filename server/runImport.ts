import { importDrugsFromList } from './importDrugs';
import path from 'path';

const dataFilePath = path.join(__dirname, 'data', 'druglist.txt');

console.log('Starting drug import script...');
importDrugsFromList(dataFilePath)
  .then(() => {
    console.log('Drug import completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error in drug import process:', error);
    process.exit(1);
  });