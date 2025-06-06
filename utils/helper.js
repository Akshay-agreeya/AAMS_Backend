const { createCanvas } = require('canvas');

exports.formattedDate = (date, dateFormat = "yyyy-MM-dd") => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based, so we add 1
  const day = String(date.getDate()).padStart(2, '0'); // Ensures day is two digits

  // Create a map to format based on the given dateFormat
  const formats = {
      "yyyy": year,
      "MM": month,
      "dd": day,
  };

  // Replace the date format with corresponding values from the map
  return dateFormat.replace(/yyyy|MM|dd/g, match => formats[match]);
};

const getProgressColor = (score) => {
  if (score >= 95) return '#4CAF50'; // green
  if (score >= 70) return '#FFC107'; // amber
  return '#F44336'; // red
};

exports.generateScoreCardImage = (score = 66, message = '', width = 600, height = 400) => {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const padding = 40;
  const cardRadius = 30;

  // Shadowed card background
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 8;

  ctx.beginPath();
  ctx.moveTo(padding + cardRadius, padding);
  ctx.lineTo(width - padding - cardRadius, padding);
  ctx.quadraticCurveTo(width - padding, padding, width - padding, padding + cardRadius);
  ctx.lineTo(width - padding, height - padding - cardRadius);
  ctx.quadraticCurveTo(width - padding, height - padding, width - padding - cardRadius, height - padding);
  ctx.lineTo(padding + cardRadius, height - padding);
  ctx.quadraticCurveTo(padding, height - padding, padding, height - padding - cardRadius);
  ctx.lineTo(padding, padding + cardRadius);
  ctx.quadraticCurveTo(padding, padding, padding + cardRadius, padding);
  ctx.closePath();
  ctx.fill();

  // Clear shadow
  ctx.shadowColor = 'transparent';

  // Title text
  ctx.fillStyle = '#333';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Audit Score', padding + 20, padding + 20);

  // Donut chart
  const centerX = width / 2;
  const centerY = height / 2 + 10;
  const radius = 75;
  const lineWidth = 20;

  const startAngle = -0.5 * Math.PI;
  const endAngle = startAngle + 2 * Math.PI * (score / 100);

  // Background circle
  ctx.beginPath();
  ctx.strokeStyle = '#eee';
  ctx.lineWidth = lineWidth;
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.stroke();

  // Progress arc
  ctx.beginPath();
  ctx.strokeStyle = getProgressColor(score);
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.arc(centerX, centerY, radius, startAngle, endAngle);
  ctx.stroke();

  // Score number
  ctx.fillStyle = '#333';
  ctx.font = 'bold 38px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${score}`, centerX, centerY);

  // Message at bottom
  ctx.fillStyle = '#333';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(message, width / 2, height - padding - 10);

  return canvas.toDataURL('image/png');
};

exports.replaceLinks= (doc, data)=> {
  try {
      // Get document.xml content
      let docXml = doc.getZip().file("word/document.xml").asText();

      // Get or create the relationships file
      let relsXml;
      try {
          relsXml = doc.getZip().file("word/_rels/document.xml.rels").asText();
      } catch (e) {
          // Create relationships file if it doesn't exist
          relsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
      }

      // Find highest existing relationship ID
      const relRegex = /Id="rId(\d+)"/g;
      let match;
      let highestRelId = 0;
      while ((match = relRegex.exec(relsXml)) !== null) {
          const id = parseInt(match[1], 10);
          if (id > highestRelId) highestRelId = id;
      }

      // Start new IDs after the highest existing one
      let relId = highestRelId + 1;

      // Create a regex pattern to find {link} placeholder
      // We need to be careful with the regex as the XML might have special formatting
  
                          const productUrl = escapeXml(data.linkObj?.url);
                          const productText = escapeXml(data.linkObj?.text);

                          // Create hyperlink XML
                          const productlinkXml = `<w:hyperlink r:id="rId${"p"}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:r><w:rPr><w:color w:val="0000FF"/><w:u w:val="single"/></w:rPr><w:t>${productText}</w:t></w:r></w:hyperlink>`;
                          const productXml = `<Relationship Id="rId${"p"}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${productUrl}" TargetMode="External"/>`;
                         
      const linkProductPattern = new RegExp(`\\\{link_product_name}`, 'g');
      if (docXml.match(linkProductPattern)) {
        docXml = docXml.replace(linkProductPattern, productlinkXml);

        if (relsXml.includes('</Relationships>')) {
            relsXml = relsXml.replace('</Relationships>', `${productXml}\n</Relationships>`);
        } else {
            relsXml += `<Relationships>${productXml}</Relationships>`;
        }
        
    }
    
      // Process each issue and its pages
      if (data.issues && Array.isArray(data.issues)) {
          for (const issue of data.issues) {
              if (issue.pages && Array.isArray(issue.pages)) {
                  let index = -1
                  for (const page of issue.pages) {
                      if (page.link && typeof page.link === 'object' && page.link.url && page.link.text) {
                          // XML-escape the URL and text
                          index += 1;
                          const escapedUrl = escapeXml(page.link.url);
                          const escapedText = escapeXml(page.link.text);

                          // Create hyperlink XML
                          const hyperlinkXml = `<w:hyperlink r:id="rId${relId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:r><w:rPr><w:color w:val="0000FF"/><w:u w:val="single"/></w:rPr><w:t>${escapedText}</w:t></w:r></w:hyperlink>`;
                          const link_var = "link_" + index;
                          const linkPlaceholderPattern = new RegExp(`\\\{${link_var}}`, 'g');
                          
            
                          // Replace the first occurrence of {link} with this hyperlink
                          // Note: We replace only one occurrence at a time to ensure correct matching
                          if (docXml.match(linkPlaceholderPattern)) {

                              docXml = docXml.replace(linkPlaceholderPattern, hyperlinkXml);

                             
                              // Add relationship for this hyperlink
                              const relXml = `<Relationship Id="rId${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${escapedUrl}" TargetMode="External"/>`;

                              // Add relationship before closing tag
                              if (relsXml.includes('</Relationships>')) {
                                  relsXml = relsXml.replace('</Relationships>', `${relXml}\n</Relationships>`);
                              } else {
                                  relsXml += `<Relationships>${relXml}</Relationships>`;
                              }

                              relId++;
                          }
                      }
                  }
              }
          }
      }

      // Save the updated XML back to the document
      doc.getZip().file("word/document.xml", docXml);
      doc.getZip().file("word/_rels/document.xml.rels", relsXml);
  } catch (error) {
      console.error("Error in replaceLinks:", error);
  }
}

/**
 * Escape special characters for XML content
 * @param {string} str - String to escape
 * @return {string} XML-escaped string
 */
 function escapeXml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

exports.getDatawithPagination = (result) => {
    const pagenation = result?.[1]?.[0] || {};
    const data = result?.[0] || [];
    return {
        contents: [...data],
        ...pagenation
    };
};


