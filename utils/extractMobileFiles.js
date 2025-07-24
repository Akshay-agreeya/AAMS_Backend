const fs = require('fs');
const { readdir, access, readFile } = fs.promises;
const path = require('path');

exports.extractMobileFiles = async (service_id, org_id, inputFolder) => {

    /* Code for read all json file and convert into json */
    const jsondata = await readAllJsonFiles(inputFolder);
    // console.log("parsed mobile data", jsondata);
    return jsondata;
}

function formatRuleId(rawId) {
    return rawId
      .replace(/([a-z])([A-Z])/g, '$1 $2')   // insert space before uppercase
      .replace(/\s+/g, ' ')                  // collapse multiple spaces
      .trim()                                // trim ends
  }
  

const readAllJsonFiles = async (inputFolder) => {
    console.log(`🚀 Starting JSON file processing in folder: ${inputFolder}`);
    console.log(`📅 Process started at: ${new Date().toISOString()}`);

    try {
        // Convert to absolute path for clarity
        const absolutePath = path.resolve(inputFolder);
        console.log(`📍 Absolute path: ${absolutePath}`);


        // Read all files in the input folder
        console.log(`📂 Reading directory contents...`);
        const files = await readdir(absolutePath);
        console.log(`📋 Found ${files.length} total files: [${files.join(', ')}]`);

        // Filter only JSON files
        const jsonFiles = files.filter(file => path.extname(file).toLowerCase() === '.json');
        console.log(`🔎 Filtered to ${jsonFiles.length} JSON files: [${jsonFiles.join(', ')}]`);

        if (jsonFiles.length === 0) {
            console.log('⚠️  No JSON files found in the input folder.');
            console.log(`📊 Process completed with 0 files processed`);
            return [];
        }

        console.log(`📄 Found ${jsonFiles.length} JSON files to process`);
        console.log(`⏳ Beginning file processing...`);

        // Array to store all processed data
        const allData = [];

        // Process each JSON file
        for (let i = 0; i < jsonFiles.length; i++) {
            const file = jsonFiles[i];
            const filePath = path.join(absolutePath, file);

            console.log(`📝 Processing file ${i + 1}/${jsonFiles.length}: ${file}`);
            console.log(`📍 Full path: ${filePath}`);

            try {
                // Check individual file permissions before reading
                console.log(`🔐 Checking file permissions for: ${file}`);
                await access(filePath, fs.constants.R_OK);
                console.log(`✅ File read permission confirmed`);

                // Read file content
                console.log(`📖 Reading file content...`);
                const fileContent = await readFile(filePath, 'utf8');
                console.log(`📏 File size: ${fileContent.length} characters`);

                // Parse JSON
                console.log(`🔧 Parsing JSON content...`);
                const jsonData = JSON.parse(fileContent);
                console.log(`📊 JSON parsed successfully - Type: ${Array.isArray(jsonData) ? 'Array' : typeof jsonData}`);

                if (Array.isArray(jsonData)) {
                    console.log(`📋 Array contains ${jsonData.length} items`);
                } else if (typeof jsonData === 'object' && jsonData !== null) {
                    console.log(`🔑 Object contains ${Object.keys(jsonData).length} keys`);
                }

                const dataRules = jsonData?.axeRuleResults?.map(rule => ({
                    axeViewId: rule.axeViewId,
                    impact: rule.impact,
                    ruleId: formatRuleId(rule.ruleId),
                    ruleSummary: rule.ruleSummary,
                    status: rule.status,
                    props: rule.props
                }))
                // Add metadata about the file
                const processedData = {
                    scanname: jsonData?.scanName,
                    Rules: dataRules,
                    score: jsonData?.score,
                    screenshot: jsonData.axeContext.screenshot,
                    tempId: `${file}_${Date.now()}` // to track which image goes with which row
                  };                               
                    
                allData.push(processedData);
                console.log(`✅ Successfully processed: ${file}`);

            } catch (error) {
                console.error(`❌ Error processing file ${file}:`, error.message);

                // Add error record to maintain processing continuity
                const errorData = {
                    filename: file,
                    filepath: filePath,
                    data: null,
                    error: error.message,
                    processedAt: new Date().toISOString()
                };

                allData.push(errorData);
                console.log(`⚠️  Added error record for ${file}`);
            }

            // Progress indicator
            console.log(`📈 Progress: ${i + 1}/${jsonFiles.length} files processed`);
        }

        console.log(`🎉 Processing complete! Successfully processed ${allData.length} files`);
        console.log(`📊 Process completed at: ${new Date().toISOString()}`);

        return allData;

    } catch (error) {
        console.error(`💥 FATAL ERROR accessing input folder:`, error.message);
        console.log(`📊 Process failed at: ${new Date().toISOString()}`);

        // Return empty array on fatal error to maintain function contract
        return [];
    }
};