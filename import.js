const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const path = require('path'); // Thêm để handle path an toàn
const connectDB = require('./config/db');
const Subscriber = require('./models/subscriber.model');
const District = require('./models/district.model');
const StaType = require('./models/sta_type.model');
const SubType = require('./models/sub_type.model');

require('dotenv').config();

const csvFolder = 'C:\\Users\\lekha\\Downloads\\TBPTM';

const importData = async () => {
  await connectDB();

  const importCSV = (fileName, Model, transform = (row) => row) => {
    const filePath = path.join(csvFolder, fileName);
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return reject(new Error(`File not found: ${filePath}`));
      }
      console.log(`Starting import for ${filePath}`);
      const data = [];
      fs.createReadStream(filePath)
        .pipe(csv({ headers: true }))
        .on('data', (row) => {
          const cleanedRow = {};
          Object.keys(row).forEach(key => {
            const cleanedKey = key.trim().replace(/^\ufeff/, '');
            cleanedRow[cleanedKey] = row[key].trim().replace(/^"|"$/g, '');
          });
          const transformed = transform(cleanedRow);
          if (transformed) {
            data.push(transformed);
          } else {
            console.warn('Skipped invalid row:', cleanedRow);
          }
        })
        .on('end', async () => {
          console.log(`Read ${data.length} valid rows from ${filePath}`);
          if (data.length > 0) {
            console.log('Sample first valid row:', data[0]); // Check data
          } else {
            console.warn(`No valid data from ${filePath}`);
          }
          try {
            await Model.deleteMany({}); // Reset
            if (data.length > 0) {
              await Model.insertMany(data, { ordered: false });
            }
            console.log(`Imported ${filePath} successfully with ${data.length} documents`);
            resolve();
          } catch (err) {
            console.error(`Error importing ${filePath}:`, err);
            reject(err);
          }
        })
        .on('error', (err) => {
          console.error(`Error reading ${filePath}:`, err);
          reject(err);
        });
    });
  };

  try {
    await importCSV('Data.csv', Subscriber, (row) => {
      if (!row.TYPE || !row.STA_TYPE || !row.SUB_ID || !row.SUB_TYPE || !row.STA_DATE || !row.PROVINCE || !row.DISTRICT) {
        return null; // Skip
      }
      try {
        row.STA_DATE = new Date(row.STA_DATE);
        if (isNaN(row.STA_DATE)) return null;
        row.END_DATE = row.END_DATE ? new Date(row.END_DATE) : null;
        row.PCK_DATE = row.PCK_DATE ? new Date(row.PCK_DATE) : null;
        row.PCK_CHARGE = row.PCK_CHARGE ? parseFloat(row.PCK_CHARGE) : null;
        delete row._id;
        return row;
      } catch (err) {
        console.warn('Date parse error for row:', row);
        return null;
      }
    });

    await importCSV('DISTRICT.csv', District, (row) => {
      if (!row.PROVINCE || !row.DISTRICT || !row.FULL_NAME) return null;
      return row;
    });

    await importCSV('STA_TYPE.csv', StaType, (row) => {
      if (!row.STA_TYPE) return null; // NAME optional
      return row;
    });

    await importCSV('SUB_TYPE.csv', SubType, (row) => {
      if (!row.SUB_TYPE) return null; // NAME optional
      return row;
    });

    console.log('All imports completed!');
    process.exit(0);
  } catch (err) {
    console.error('Import failed:', err);
    process.exit(1);
  }
};

importData();