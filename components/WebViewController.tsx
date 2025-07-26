import React, { useRef, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  ActivityIndicator 
} from 'react-native';
import { WebView } from 'react-native-webview';

interface WebViewControllerProps {
  url: string;
  platformColor: string;
  onNavigationStateChange?: (event: any) => void;
  onLoadEnd?: () => void;
}

const WebViewController: React.FC<WebViewControllerProps> = ({ 
  url, 
  platformColor, 
  onNavigationStateChange, 
  onLoadEnd 
}) => {
  const webViewRef = useRef<WebView>(null);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadProgress = ({ nativeEvent }: any) => {
    setProgress(nativeEvent.progress);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
    if (onLoadEnd) {
      onLoadEnd();
    }
  };

  const handleNavigationState = (event: any) => {
    if (onNavigationStateChange) {
      onNavigationStateChange(event);
    }
  };

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar, 
              { 
                width: `${progress * 100}%`,
                backgroundColor: platformColor 
              }
            ]} 
          />
        </View>
      )}
      
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webView}
        onNavigationStateChange={handleNavigationState}
        onLoadProgress={handleLoadProgress}
        onLoadEnd={handleLoadEnd}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <ActivityIndicator 
            size="large" 
            color={platformColor} 
            style={styles.loader} 
          />
        )}
        testID={`webview-controller`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    height: 3,
    width: '100%',
    backgroundColor: '#e0e0e0',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  progressBar: {
    height: '100%',
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

export default WebViewController;