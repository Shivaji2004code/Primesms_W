const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Create a test Excel file with phone numbers
function createTestExcelFile() {
    const testData = [
        ['919398424270'],
        ['918765432109'],
        ['917654321098'],
        ['+91 987 654 3210'],
        ['91-876-543-2109'],
        ['invalid_number'],
        ['']
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(testData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    const filePath = './test-phone-numbers.xlsx';
    XLSX.writeFile(workbook, filePath);
    console.log('📁 Created test Excel file:', filePath);
    return filePath;
}

// Test the Excel import endpoint
async function testExcelImport() {
    try {
        console.log('🧪 Starting Excel import test...');
        
        // Create test file
        const testFilePath = createTestExcelFile();
        
        // Test local Excel parsing first
        console.log('\n📊 Testing local Excel parsing...');
        const workbook = XLSX.readFile(testFilePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log('Raw Excel data:', jsonData);
        
        const phoneNumbers = jsonData
            .map((row, index) => {
                const phone = row[0]?.toString().trim();
                console.log(`Row ${index + 1}: ${phone}`);
                return phone;
            })
            .filter(phone => phone && phone !== '');
        
        console.log('Extracted phone numbers:', phoneNumbers);
        
        // Test API endpoint
        console.log('\n🌐 Testing API endpoint...');
        const form = new FormData();
        form.append('file', fs.createReadStream(testFilePath));
        
        // You'll need to get a valid auth cookie first - let's just test the parsing logic
        console.log('✅ Local parsing test completed');
        console.log(`📱 Found ${phoneNumbers.length} phone numbers`);
        
        // Clean up test file
        fs.unlinkSync(testFilePath);
        console.log('🗑️ Cleaned up test file');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testExcelImport();