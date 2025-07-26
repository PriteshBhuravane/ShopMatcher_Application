import React from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  TouchableOpacityProps,
  Platform
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface PlatformButtonProps extends TouchableOpacityProps {
  name: string;
  color: string;
  isSelected: boolean;
}

const PlatformButton: React.FC<PlatformButtonProps> = ({ 
  name, 
  color, 
  isSelected, 
  onPress,
  ...props 
}) => {
  const handlePress = (event: any) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    
    if (onPress) {
      onPress(event);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isSelected && styles.selectedButton,
        { borderBottomColor: isSelected ? color : 'transparent' }
      ]}
      onPress={handlePress}
      testID={`platform-button-${name.toLowerCase()}`}
      {...props}
    >
      <Text 
        style={[
          styles.buttonText,
          isSelected && styles.selectedButtonText,
          { color: isSelected ? color : '#666' }
        ]}
      >
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  selectedButton: {
    borderBottomWidth: 3,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedButtonText: {
    fontWeight: 'bold',
  },
});

export default PlatformButton;