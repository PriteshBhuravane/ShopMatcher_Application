import { Colors } from "@/app-example/constants/Colors";
import { Tabs } from "expo-router";
import { ShoppingCart } from "lucide-react-native";
import React from "react";



export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Product Comparison",
          tabBarIcon: ({ color }) => <ShoppingCart  />,
          tabBarLabel: "Compare",
        }}
      />
    </Tabs>
  );
}