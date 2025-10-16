#!/usr/bin/env node

const fs = require('fs');
const https = require('https');
const path = require('path');

// Real Unsplash fashion photo IDs
const fashionPhotoIds = [
  '1594633312681-425c7b97ccd1', // Fashion portrait
  '1544022613-e87ca75a784a',   // Denim jacket
  '1521572163474-6864f9cf17ab', // White tee
  '1594938298603-c8148c4dae35', // Blazer
  '1571945153237-4929e83af6a4', // Sweater
  '1551028719-00167b16eac5',   // Leather jacket
  '1549298916-b41d501d3772',   // Sneakers
  '1594736797933-d0401ba2fe65', // Dress
  '1507003211169-0a1dd7228f2d', // Portrait
  '1553062407-98eeb64c6a62',   // Bag
  '1541099649105-f69ad21f3246', // Jeans
  '1601762603339-fd61e28b698a', // Scarf
  '1591047139829-d91aecb6caea', // Coat
  '1544966503-7cc5ac882d5f',   // Boots
  '1506630448388-4e683c67ddb0', // Jewelry
  '1494790108755-2616b612b786', // Portrait
  '1438761681033-6461ffad8d80', // Portrait
  '1534528741775-53994a69daeb', // Portrait
  '1544005313-94ddf0286df2',   // Portrait
  '1524504388940-b1c1722653e1', // Portrait
  '1488426862026-3ee34a7d66df', // Portrait
  '1596755094514-f87e34085b2c', // Shirt
  '1594633312681-425c7b97ccd1', // Fashion
  '1544022613-e87ca75a784a',   // Fashion
  '1521572163474-6864f9cf17ab', // Fashion
  '1594938298603-c8148c4dae35', // Fashion
  '1571945153237-4929e83af6a4', // Fashion
  '1551028719-00167b16eac5',   // Fashion
  '1549298916-b41d501d3772',   // Fashion
  '1594736797933-d0401ba2fe65', // Fashion
  '1507003211169-0a1dd7228f2d', // Fashion
  '1553062407-98eeb64c6a62',   // Fashion
  '1541099649105-f69ad21f3246', // Fashion
  '1601762603339-fd61e28b698a', // Fashion
  '1591047139829-d91aecb6caea', // Fashion
  '1544966503-7cc5ac882d5f',   // Fashion
  '1506630448388-4e683c67ddb0', // Fashion
  '1494790108755-2616b612b786', // Fashion
  '1438761681033-6461ffad8d80', // Fashion
  '1534528741775-53994a69daeb', // Fashion
  '1544005313-94ddf0286df2',   // Fashion
  '1524504388940-b1c1722653e1', // Fashion
  '1488426862026-3ee34a7d66df', // Fashion
  '1596755094514-f87e34085b2c', // Fashion
];

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

async function downloadMockImages() {
  const imagesDir = path.join(__dirname, '..', 'assets', 'mock-images');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  console.log('📥 Downloading mock images...');
  
  // Download product images (400x400)
  for (let i = 0; i < 50; i++) {
    const photoId = fashionPhotoIds[i % fashionPhotoIds.length];
    const url = `https://images.unsplash.com/photo-${photoId}?w=400&h=400&fit=crop`;
    const filepath = path.join(imagesDir, `product_${String(i + 1).padStart(3, '0')}.jpg`);
    
    try {
      await downloadImage(url, filepath);
      console.log(`✅ Downloaded product_${String(i + 1).padStart(3, '0')}.jpg`);
    } catch (error) {
      console.log(`❌ Failed to download product_${String(i + 1).padStart(3, '0')}.jpg`);
    }
  }

  // Download FitPic images (800x1000)
  for (let i = 0; i < 50; i++) {
    const photoId = fashionPhotoIds[i % fashionPhotoIds.length];
    const url = `https://images.unsplash.com/photo-${photoId}?w=800&h=1000&fit=crop`;
    const filepath = path.join(imagesDir, `fitpic_${String(i + 1).padStart(3, '0')}.jpg`);
    
    try {
      await downloadImage(url, filepath);
      console.log(`✅ Downloaded fitpic_${String(i + 1).padStart(3, '0')}.jpg`);
    } catch (error) {
      console.log(`❌ Failed to download fitpic_${String(i + 1).padStart(3, '0')}.jpg`);
    }
  }

  console.log('🎉 Download complete!');
  console.log(`📁 Images saved to: ${imagesDir}`);
}

// Run the download
downloadMockImages().catch(console.error);
