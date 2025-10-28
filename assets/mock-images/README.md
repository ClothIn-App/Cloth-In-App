# Mock Images for Testing

This folder contains placeholder images for testing the app.

## How to Add Images

1. **Download fashion images** from:
   - Unsplash (free, high-quality)
   - Pexels (free)
   - Fashion websites (with permission)

2. **Naming convention**:
   - `product_001.jpg`, `product_002.jpg`, etc.
   - `fitpic_001.jpg`, `fitpic_002.jpg`, etc.

3. **Recommended sizes**:
   - Products: 400x400px (square)
   - FitPics: 800x1000px (portrait)

4. **Update mock data** to use local images:
   ```javascript
   imageUrl: require('../assets/mock-images/product_001.jpg')
   ```

## Quick Setup Script

Run this to download sample images:
```bash
# Download 50 sample fashion images from Unsplash
for i in {1..50}; do
  curl -L "https://picsum.photos/400/400?random=$i" -o "product_$(printf '%03d' $i).jpg"
done
```
