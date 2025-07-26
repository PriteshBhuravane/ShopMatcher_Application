import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Image,
  Platform,
} from "react-native";
import { Camera } from "lucide-react-native";
import * as Haptics from "expo-haptics";

interface SearchBarWidgetProps {
  onSearch: (query: string) => void;
  onImagePick: () => void;
  onCamera: () => void;
}

const SearchBarWidget: React.FC<SearchBarWidgetProps> = ({
  onSearch,
  onImagePick,
  onCamera,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onSearch(searchQuery);
  };

  const handleImagePick = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onImagePick();
  };

  const handleCamera = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onCamera();
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search for products..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={handleSearch}
        returnKeyType="search"
        testID="search-input"
      />

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleImagePick}
          testID="image-picker-button"
        >
          <Image
            source={{
              uri: "https://img.icons8.com/ios-filled/50/000000/image.png",
            }}
            style={styles.icon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleCamera}
          testID="camera-button"
        >
          <Camera size={24}  />


        </TouchableOpacity>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          testID="search-button"
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#f9f9f9",
    marginBottom: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  icon: {
    width: 24,
    height: 24,
  },
  searchButton: {
    backgroundColor: "#4a89dc",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default SearchBarWidget;
