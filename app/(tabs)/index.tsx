import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Platform,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Alert
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import { Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import ImageSearchService from '@/services/ImageSearchService';

// Constants
const PLATFORMS = [
  { name: 'Flipkart', baseUrl: 'https://www.flipkart.com/', color: '#2874f0' },
  { name: 'Amazon', baseUrl: 'https://www.amazon.in/', color: '#ff9900' },
  { name: 'Snapdeal', baseUrl: 'https://www.snapdeal.com/', color: '#e40046' }
];

export default function ProductComparisonScreen() {
  const [selectedPlatform, setSelectedPlatform] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [isImageSearching, setIsImageSearching] = useState(false);
  
  // WebView references
  const webViewRefs = useRef([
    React.createRef<WebView>(),
    React.createRef<WebView>(),
    React.createRef<WebView>()
  ]);
  
  // URLs for each platform
  const [urls, setUrls] = useState([
    PLATFORMS[0].baseUrl,
    PLATFORMS[1].baseUrl,
    PLATFORMS[2].baseUrl
  ]);

  // Handle platform selection
  const handlePlatformSelect = (index: number) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setSelectedPlatform(index);
  };

  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    searchOnAllPlatforms(searchQuery);
  };

  // Search on all platforms
  const searchOnAllPlatforms = (query: string) => {
    const encodedQuery = encodeURIComponent(query.trim());
    
    const newUrls = [
      `${PLATFORMS[0].baseUrl}search?q=${encodedQuery}`,
      `${PLATFORMS[1].baseUrl}s?k=${encodedQuery}`,
      `${PLATFORMS[2].baseUrl}search?keyword=${encodedQuery}`
    ];
    
    setUrls(newUrls);
    console.log('Searching on all platforms for:', query);
    console.log('URLs:', newUrls);
  };

  // Handle image picker
  const handleImagePick = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        console.log('Image selected:', imageUri);
        await performImageSearch(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      setIsLoading(false);
      setIsImageSearching(false);
    }
  };

  // Handle camera
  const handleCamera = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to capture images.');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        console.log('Image captured:', imageUri);
        await performImageSearch(imageUri);
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
      setIsLoading(false);
      setIsImageSearching(false);
    }
  };

  // Handle WebView navigation state change
  const handleNavigationStateChange = (event: any, index: number) => {
    console.log(`Navigation state changed for ${PLATFORMS[index].name}:`, event.url);
    
    // For Amazon, we could inject affiliate tag if needed
    if (index === 1 && event.url.includes('amazon') && !event.url.includes('tag=')) {
      // This would add an affiliate tag to Amazon URLs
      // const newUrl = event.url + (event.url.includes('?') ? '&' : '?') + 'tag=youraffiliateID';
      // webViewRefs.current[index].current?.loadUrl(newUrl);
    }
  };

  // Handle WebView load progress
  const handleLoadProgress = ({ nativeEvent }: any) => {
    setProgress(nativeEvent.progress);
  };

  // Handle WebView load end
  const handleLoadEnd = () => {
    // Only stop loading if we're not in the middle of an image search
    if (!isImageSearching) {
      setIsLoading(false);
    }
    setProgress(0);
  };

  // Perform image search using AI and other methods
  const performImageSearch = async (imageUri: string) => {
    setIsImageSearching(true);
    setIsLoading(true);
    setSearchStatus('🔍 Analyzing image...');
    
    try {
      console.log('Starting comprehensive image search for:', imageUri);
      
      // Validate image first
      const isValid = await ImageSearchService.validateImageUri(imageUri);
      if (!isValid) {
        throw new Error('Invalid image file');
      }
      
      // Get image metadata for logging
      const metadata = await ImageSearchService.getImageMetadata(imageUri);
      console.log('Image metadata:', metadata);
      
      // Update status to show AI processing
      setSearchStatus('🤖 AI analyzing product...');
      
      // Use the ImageSearchService to analyze the image and get search terms
      const searchTerm = await ImageSearchService.searchProductByImage(imageUri);
      
      console.log('✅ Image search completed. Search term:', searchTerm);
      setSearchStatus(`✅ Found: ${searchTerm}`);
      
      // Update the search query in the UI
      setSearchQuery(searchTerm);
      
      // Update status to show platform search
      setSearchStatus(`🛒 Searching on all platforms for: ${searchTerm}`);
      
      // Search on all platforms with the identified product
      searchOnAllPlatforms(searchTerm);
      
      // Show success message with more details
      setTimeout(() => {
        setSearchStatus(`🎯 Results loaded for: ${searchTerm}`);
        setTimeout(() => {
          setSearchStatus('');
        }, 2000);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Image search failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setSearchStatus('❌ Image search failed');
      
      Alert.alert(
        'Image Search Failed', 
        `${errorMessage}\n\nTips for better results:\n• Use clear, well-lit images\n• Focus on the main product\n• Avoid cluttered backgrounds\n• Try different angles`,
        [
          { text: 'Try Again', onPress: () => setSearchStatus('') },
          { text: 'Manual Search', onPress: () => {
            setSearchStatus('');
            // Focus on search input for manual entry
          }}
        ]
      );
      
      // Clear status after delay if user doesn't interact
      setTimeout(() => {
        setSearchStatus('');
      }, 5000);
    } finally {
      setIsImageSearching(false);
      // Keep loading state until WebViews finish loading
    }
  };

  // Custom WebView for each platform
  const renderWebView = (index: number) => {
    return (
      <WebView
        ref={webViewRefs.current[index]}
        source={{ uri: urls[index] }}
        style={styles.webView}
        onNavigationStateChange={(event) => handleNavigationStateChange(event, index)}
        onLoadProgress={handleLoadProgress}
        onLoadEnd={handleLoadEnd}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => <ActivityIndicator size="large" color={PLATFORMS[index].color} style={styles.loader} />}
        testID={`webview-${PLATFORMS[index].name.toLowerCase()}`}
      />
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen 
        options={{
          title: 'Product Comparison',
          headerTitleStyle: styles.headerTitle,
        }}
      />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for products or use camera/gallery..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          testID="search-input"
          editable={!isImageSearching}
        />
        
        {/* Search Status */}
        {searchStatus !== '' && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>{searchStatus}</Text>
            {isImageSearching && (
              <ActivityIndicator size="small" color="#4a89dc" style={styles.statusLoader} />
            )}
          </View>
        )}
        
        <View style={styles.searchActions}>
          <TouchableOpacity 
            style={[
              styles.iconButton,
              isImageSearching && styles.disabledButton
            ]} 
            onPress={handleImagePick}
            disabled={isImageSearching}
            testID="image-picker-button"
          >
            {isImageSearching ? (
              <ActivityIndicator size={20} color="#666" />
            ) : (
              <Image 
                source={{ uri: 'https://img.icons8.com/ios-filled/50/000000/image.png' }} 
                style={styles.icon} 
              />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.iconButton,
              isImageSearching && styles.disabledButton
            ]} 
            onPress={handleCamera}
            disabled={isImageSearching}
            testID="camera-button"
          >
            {isImageSearching ? (
              <ActivityIndicator size={20} color="#666" />
            ) : (
              <Camera size={24}   />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.searchButton,
              (!searchQuery.trim() || isImageSearching) && styles.disabledSearchButton
            ]} 
            onPress={handleSearch}
            disabled={!searchQuery.trim() || isImageSearching}
            testID="search-button"
          >
            <Text style={[
              styles.searchButtonText,
              (!searchQuery.trim() || isImageSearching) && styles.disabledSearchButtonText
            ]}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Platform Tabs */}
      <View style={styles.tabsContainer}>
        {PLATFORMS.map((platform, index) => (
          <TouchableOpacity
            key={platform.name}
            style={[
              styles.tab,
              selectedPlatform === index && styles.selectedTab,
              { borderBottomColor: platform.color }
            ]}
            onPress={() => handlePlatformSelect(index)}
            testID={`platform-tab-${platform.name.toLowerCase()}`}
          >
            <Text 
              style={[
                styles.tabText,
                selectedPlatform === index && styles.selectedTabText,
                { color: selectedPlatform === index ? platform.color : '#666' }
              ]}
            >
              {platform.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Progress Bar */}
      {(isLoading || isImageSearching) && (
        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar, 
              { 
                width: isImageSearching ? '100%' : `${progress * 100}%`,
                backgroundColor: PLATFORMS[selectedPlatform].color 
              }
            ]} 
          />
        </View>
      )}
      
      {/* WebViews */}
      <View style={styles.webViewContainer}>
        {PLATFORMS.map((platform, index) => (
          <View 
            key={platform.name}
            style={[
              styles.webViewWrapper,
              { display: selectedPlatform === index ? 'flex' : 'none' }
            ]}
          >
            {renderWebView(index)}
          </View>
        ))}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  searchActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  icon: {
    width: 24,
    height: 24,
  },
  searchButton: {
    backgroundColor: '#4a89dc',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledSearchButton: {
    backgroundColor: '#ccc',
  },
  disabledSearchButtonText: {
    color: '#999',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#4a89dc',
    fontWeight: '500',
  },
  statusLoader: {
    marginLeft: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  selectedTab: {
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedTabText: {
    fontWeight: 'bold',
  },
  progressContainer: {
    height: 3,
    width: '100%',
    backgroundColor: '#e0e0e0',
  },
  progressBar: {
    height: '100%',
  },
  webViewContainer: {
    flex: 1,
  },
  webViewWrapper: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});