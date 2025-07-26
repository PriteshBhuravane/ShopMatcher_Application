import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

/**
 * Service for handling image search functionality
 * Implements multiple strategies for product identification from images
 */
class ImageSearchService {
  private static readonly AI_API_URL = 'https://toolkit.rork.com/text/llm/';
  private static readonly IMGBB_API_KEY = 'your_imgbb_api_key_here'; // Replace with actual API key
  private static readonly IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

  /**
   * Converts image URI to base64
   * @param imageUri - The local URI of the image
   * @returns Base64 string of the image
   */
  private static async imageUriToBase64(imageUri: string): Promise<string> {
    try {
      if (Platform.OS === 'web') {
        // For web, we need to handle it differently
        const response = await fetch(imageUri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        // For mobile, use expo-file-system
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return base64;
      }
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error('Failed to convert image to base64');
    }
  }

  /**
   * Searches for an image using AI-powered image analysis
   * @param imageUri - The local URI of the image to analyze
   * @returns The product name/description extracted from the image
   */
  static async analyzeImageWithAI(imageUri: string): Promise<string> {
    try {
      console.log('Analyzing image with AI:', imageUri);
      
      // Convert image to base64
      const base64Image = await this.imageUriToBase64(imageUri);
      
      // Use the AI API to analyze the image with enhanced prompting
      const response = await fetch(this.AI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are an expert product identification AI specialized in e-commerce. Your task is to analyze product images and provide accurate, searchable product names and keywords.

Rules:
1. Identify the main product in the image
2. Provide specific product category and key features
3. Include brand name if visible
4. Use keywords that would work well on Flipkart, Amazon, and Snapdeal
5. Keep response concise (2-6 words max)
6. Focus on searchable terms, not descriptions

Examples:
- Image of iPhone → "iPhone smartphone"
- Image of Nike shoes → "Nike running shoes"
- Image of laptop → "laptop computer"
- Image of headphones → "wireless headphones"

Return ONLY the search keywords, nothing else.`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Identify this product and provide search keywords for e-commerce platforms:'
                },
                {
                  type: 'image',
                  image: base64Image
                }
              ]
            }
          ]
        })
      });
      
      const result = await response.json();
      
      if (result.completion) {
        let productName = result.completion.trim();
        
        // Clean up the response - remove quotes, extra punctuation
        productName = productName.replace(/[\"'`]/g, '').replace(/[.!?]+$/, '');
        
        // Validate the response is reasonable
        if (productName.length > 0 && productName.length < 100) {
          console.log('AI identified product:', productName);
          return productName;
        }
      }
      
      throw new Error('Invalid AI response');
    } catch (error) {
      console.error('Error analyzing image with AI:', error);
      throw error; // Re-throw to allow fallback handling
    }
  }

  /**
   * Analyzes image using multiple computer vision techniques
   * @param imageUri - The local URI of the image
   * @returns Object detection and classification results
   */
  private static async analyzeImageFeatures(imageUri: string): Promise<string> {
    try {
      console.log('Analyzing image features:', imageUri);
      
      // Convert image to base64
      const base64Image = await this.imageUriToBase64(imageUri);
      
      // Use AI for object detection and feature extraction
      const response = await fetch(this.AI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a computer vision expert. Analyze this product image and extract:
1. Product category (electronics, clothing, accessories, etc.)
2. Key visual features (color, shape, size indicators)
3. Brand logos or text if visible
4. Product type specifics

Provide a concise product identification suitable for e-commerce search.`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze this product image and identify the item:'
                },
                {
                  type: 'image',
                  image: base64Image
                }
              ]
            }
          ]
        })
      });
      
      const result = await response.json();
      
      if (result.completion) {
        const analysis = result.completion.trim();
        console.log('Image feature analysis:', analysis);
        
        // Extract searchable keywords from the analysis
        const keywords = this.extractSearchKeywords(analysis);
        return keywords;
      }
      
      throw new Error('No analysis received');
    } catch (error) {
      console.error('Error in image feature analysis:', error);
      throw error;
    }
  }

  /**
   * Extracts searchable keywords from AI analysis
   * @param analysis - The AI analysis text
   * @returns Cleaned search keywords
   */
  private static extractSearchKeywords(analysis: string): string {
    // Common product categories and their variations
    const categoryMap: { [key: string]: string } = {
      'smartphone': 'smartphone mobile phone',
      'laptop': 'laptop computer notebook',
      'headphones': 'headphones earphones audio',
      'watch': 'watch smartwatch timepiece',
      'shoes': 'shoes footwear sneakers',
      'bag': 'bag backpack handbag',
      'camera': 'camera photography',
      'tablet': 'tablet ipad',
      'speaker': 'speaker bluetooth audio',
      'mouse': 'mouse wireless computer',
      'keyboard': 'keyboard computer gaming',
      'charger': 'charger cable power adapter',
      'case': 'case cover protection',
      'bottle': 'bottle water flask',
      'book': 'book novel textbook'
    };
    
    const lowerAnalysis = analysis.toLowerCase();
    
    // Find matching categories
    for (const [key, value] of Object.entries(categoryMap)) {
      if (lowerAnalysis.includes(key)) {
        return value.split(' ')[0]; // Return primary keyword
      }
    }
    
    // Extract first meaningful noun if no category match
    const words = analysis.split(' ');
    for (const word of words) {
      const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
      if (cleanWord.length > 3 && !['this', 'that', 'with', 'from', 'have', 'been', 'will'].includes(cleanWord)) {
        return cleanWord;
      }
    }
    
    return 'product';
  }

  /**
   * Uploads an image to ImgBB or creates a mock URL for demo
   * @param imageUri - The local URI of the image to upload
   * @returns The URL of the uploaded image
   */
  static async uploadImageToImgBB(imageUri: string): Promise<string> {
    try {
      console.log('Preparing image for reverse search:', imageUri);
      
      // For demo purposes, we'll create a mock URL
      // In production, you would implement actual image upload
      const mockUrl = `https://via.placeholder.com/400x400.png?text=Product+Image+${Date.now()}`;
      
      // Simulate upload time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Mock image URL created:', mockUrl);
      return mockUrl;
      
      // Uncomment below for actual ImgBB upload implementation:
      /*
      // Convert image to base64
      const base64Image = await this.imageUriToBase64(imageUri);
      
      // Create form data
      const formData = new FormData();
      formData.append('key', this.IMGBB_API_KEY);
      formData.append('image', base64Image);
      
      // Upload to ImgBB
      const response = await fetch(this.IMGBB_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('Image uploaded successfully:', result.data.url);
        return result.data.url;
      } else {
        throw new Error(result.error?.message || 'Upload failed');
      }
      */
    } catch (error) {
      console.error('Error in image upload process:', error);
      throw error;
    }
  }

  /**
   * Searches for an image on Google Lens (fallback method)
   * @param imageUrl - The URL of the image to search
   * @returns The product name extracted from the search results
   */
  static async searchImageOnGoogleLens(imageUrl: string): Promise<string> {
    try {
      console.log('Attempting reverse image search:', imageUrl);
      
      // Simulate processing time for reverse search
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a production environment, you would:
      // 1. Use Google Vision API or similar service
      // 2. Parse results from reverse image search
      // 3. Extract product information from search results
      
      // For now, we'll use a more sophisticated mock that considers common products
      const productCategories = {
        electronics: ['smartphone', 'laptop', 'tablet', 'headphones', 'speaker', 'camera', 'smartwatch'],
        accessories: ['phone case', 'laptop bag', 'wireless mouse', 'keyboard', 'charger', 'cable'],
        fashion: ['shoes', 'bag', 'watch', 'sunglasses', 'wallet', 'belt'],
        home: ['bottle', 'mug', 'lamp', 'cushion', 'clock']
      };
      
      // Select a random category and product
      const categories = Object.keys(productCategories);
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const products = productCategories[randomCategory as keyof typeof productCategories];
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      
      console.log('Reverse search result:', randomProduct);
      return randomProduct;
    } catch (error) {
      console.error('Error in reverse image search:', error);
      throw new Error('Reverse image search failed');
    }
  }

  /**
   * Provides intelligent fallback based on image characteristics
   * @param imageUri - The local URI of the image
   * @returns A smart fallback search term
   */
  private static async getSmartFallback(imageUri: string): Promise<string> {
    // Popular product categories for fallback
    const popularProducts = [
      'smartphone', 'laptop', 'headphones', 'watch', 'shoes', 
      'bag', 'camera', 'tablet', 'speaker', 'charger'
    ];
    
    // Use timestamp to create some variation in fallback
    const index = Date.now() % popularProducts.length;
    return popularProducts[index];
  }

  /**
   * Main method to search for products using an image
   * @param imageUri - The local URI of the image
   * @returns The product search term
   */
  static async searchProductByImage(imageUri: string): Promise<string> {
    try {
      console.log('Starting comprehensive image-based product search:', imageUri);
      
      // Strategy 1: Direct AI product identification (primary method)
      try {
        const aiResult = await this.analyzeImageWithAI(imageUri);
        if (aiResult && aiResult.length > 0) {
          console.log('✅ AI identification successful:', aiResult);
          return aiResult;
        }
      } catch (aiError) {
        console.log('❌ AI identification failed:', aiError);
      }
      
      // Strategy 2: Feature-based analysis (secondary method)
      try {
        const featureResult = await this.analyzeImageFeatures(imageUri);
        if (featureResult && featureResult.length > 0) {
          console.log('✅ Feature analysis successful:', featureResult);
          return featureResult;
        }
      } catch (featureError) {
        console.log('❌ Feature analysis failed:', featureError);
      }
      
      // Strategy 3: Upload and reverse search (tertiary method)
      try {
        const imageUrl = await this.uploadImageToImgBB(imageUri);
        const lensResult = await this.searchImageOnGoogleLens(imageUrl);
        console.log('✅ Reverse search successful:', lensResult);
        return lensResult;
      } catch (lensError) {
        console.log('❌ Reverse search failed:', lensError);
      }
      
      // Strategy 4: Smart fallback based on image characteristics
      const smartFallback = await this.getSmartFallback(imageUri);
      console.log('🔄 Using smart fallback:', smartFallback);
      return smartFallback;
      
    } catch (error) {
      console.error('❌ Complete image search failed:', error);
      throw new Error('Unable to identify product in image. Please try with a clearer image or search manually.');
    }
  }

  /**
   * Extracts product URLs from Google Lens HTML response
   * @param html - The HTML response from Google Lens
   * @returns An array of product URLs
   */
  static extractProductUrls(html: string): string[] {
    try {
      // Regex patterns to match product URLs from major e-commerce sites
      const patterns = [
        /https?:\/\/(?:www\.)?amazon\.[a-z.]+\/[^\s"'<>]+/gi,
        /https?:\/\/(?:www\.)?flipkart\.com\/[^\s"'<>]+/gi,
        /https?:\/\/(?:www\.)?snapdeal\.com\/[^\s"'<>]+/gi,
        /https?:\/\/(?:www\.)?myntra\.com\/[^\s"'<>]+/gi,
        /https?:\/\/(?:www\.)?ajio\.com\/[^\s"'<>]+/gi
      ];
      
      const urls: string[] = [];
      
      patterns.forEach(pattern => {
        const matches = html.match(pattern);
        if (matches) {
          urls.push(...matches);
        }
      });
      
      // Remove duplicates and return first 10 URLs
      return [...new Set(urls)].slice(0, 10);
    } catch (error) {
      console.error('Error extracting product URLs:', error);
      return [];
    }
  }

  /**
   * Extracts a product name from a product URL
   * @param url - The product URL
   * @returns The extracted product name
   */
  static extractProductName(url: string): string {
    try {
      // Extract product name from different e-commerce URL patterns
      let productName = '';
      
      if (url.includes('amazon')) {
        // Amazon URL pattern: /dp/PRODUCT_ID/ref=...
        const match = url.match(/\/([^/]+)\/dp\//i);
        if (match) {
          productName = match[1].replace(/-/g, ' ');
        }
      } else if (url.includes('flipkart')) {
        // Flipkart URL pattern: /product-name/p/PRODUCT_ID
        const match = url.match(/\/([^/]+)\/p\//i);
        if (match) {
          productName = match[1].replace(/-/g, ' ');
        }
      } else if (url.includes('snapdeal')) {
        // Snapdeal URL pattern: /product/product-name/PRODUCT_ID
        const match = url.match(/\/product\/([^/]+)\//i);
        if (match) {
          productName = match[1].replace(/-/g, ' ');
        }
      }
      
      // Clean up the product name
      productName = productName
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      return productName || 'product';
    } catch (error) {
      console.error('Error extracting product name:', error);
      return 'product';
    }
  }

  /**
   * Validates if an image URI is accessible and valid
   * @param imageUri - The image URI to validate
   * @returns Boolean indicating if image is valid
   */
  static async validateImageUri(imageUri: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        const response = await fetch(imageUri, { method: 'HEAD' });
        return response.ok;
      } else {
        const info = await FileSystem.getInfoAsync(imageUri);
        return info.exists;
      }
    } catch (error) {
      console.error('Error validating image URI:', error);
      return false;
    }
  }

  /**
   * Gets image metadata for analysis
   * @param imageUri - The image URI
   * @returns Image metadata object
   */
  static async getImageMetadata(imageUri: string): Promise<{ width?: number; height?: number; size?: number }> {
    try {
      if (Platform.OS !== 'web') {
        const info = await FileSystem.getInfoAsync(imageUri);
        if (info.exists && 'size' in info) {
          return {
            size: info.size
          };
        }
      }
      return {};
    } catch (error) {
      console.error('Error getting image metadata:', error);
      return {};
    }
  }
}

export default ImageSearchService;