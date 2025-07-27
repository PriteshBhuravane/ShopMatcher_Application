import { useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const slides = [
  {
    key: 'slide1',
    title: 'Welcome to ShopMatcher!',
    description: 'Find the best shops and deals tailored for you.',
    image: require('../assets/images/icon.png'),
  },
  {
    key: 'slide2',
    title: 'Search & Discover',
    description: 'Easily search and discover new shops near you.',
    image: require('../assets/images/adaptive-icon.png'),
  },
  {
    key: 'slide3',
    title: 'Get Started',
    description: 'Let’s get started and find your match!',
    image: require('../assets/images/splash-icon.png'),
  },
];

const { width } = Dimensions.get('window');

const OnboardingScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [current, setCurrent] = useState(0);

  const handleNext = () => {
    if (current < slides.length - 1) {
      setCurrent(current + 1);
    } else {
      onFinish();
    }
  };

  const handleSkip = () => {
    onFinish();
  };

  return (
    <View style={styles.container}>
      <Image source={slides[current].image} style={styles.image} resizeMode="contain" />
      <Text style={styles.title}>{slides[current].title}</Text>
      <Text style={styles.description}>{slides[current].description}</Text>
      <View style={styles.buttonRow}>
        {current < slides.length - 1 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
          <Text style={styles.nextText}>{current === slides.length - 1 ? 'Get Started' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.dotsRow}>
        {slides.map((_, idx) => (
          <View key={idx} style={[styles.dot, current === idx && styles.activeDot]} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  image: {
    width: width * 0.7,
    height: width * 0.7,
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    color: '#888',
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  nextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    margin: 4,
  },
  activeDot: {
    backgroundColor: '#007AFF',
  },
});

export default OnboardingScreen; 