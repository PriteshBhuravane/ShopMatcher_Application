import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import OnboardingScreen from "../components/OnboardingScreen";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      const completed = await AsyncStorage.getItem('onboardingCompleted');
      setShowOnboarding(completed !== 'true');
      SplashScreen.hideAsync();
    };
    checkOnboarding();
  }, []);

  const handleFinishOnboarding = async () => {
    await AsyncStorage.setItem('onboardingCompleted', 'true');
    setShowOnboarding(false);
  };

  if (showOnboarding === null) {
    // Still loading
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        {showOnboarding ? (
          <OnboardingScreen onFinish={handleFinishOnboarding} />
        ) : (
          <RootLayoutNav />
        )}
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
