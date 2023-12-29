import React, { useState, useEffect } from "react";
import { View, Text, Button, LogBox, BackHandler, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import API_BASE_URL from "../apiConfig";
import { FIREBASE_AUTH } from "../FirebaseConfig";

export function HomeScreen() {
  const navigation = useNavigation();

  // Set navigation options to hide the back button
  useEffect(() => {
    navigation.setOptions({
      headerLeft: null, // Hide the back button in the header
    });
  }, []);

  // Add this in your component
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        // Show an alert or confirmation dialog
        Alert.alert(
          "Confirmation",
          "Do you want to exit the app?",
          [
            {
              text: "Cancel",
              onPress: () => {},
              style: "cancel",
            },
            {
              text: "OK",
              onPress: () => {
                // Handle the back button action here (e.g., exit the app)
                BackHandler.exitApp();
              },
            },
          ],
          { cancelable: false }
        );
        return true;
      }
    );

    return () => backHandler.remove(); // Cleanup when the component unmounts
  }, []);

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const email = await AsyncStorage.getItem("userEmail");
        const id = await AsyncStorage.getItem("userId");
      } catch (error) {
        console.error("Error retrieving user information:", error);
      }
    };

    getUserInfo();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      const response = await fetch(
        `${API_BASE_URL}/logout?user_id=${user_id}`,
        {
          method: "GET",
        }
      );

      if (response.ok) {
        // LogBox.ignoreAllLogs();
        navigation.replace("HaveAccountScreen");
        console.log("Logout successful");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const signOut = async () => {
    try {
      await FIREBASE_AUTH.signOut();
      navigation.replace("HaveAccountScreen");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Function to save the selected screen to AsyncStorage
  const saveSelectedScreen = async (screenName) => {
    try {
      await AsyncStorage.setItem("selectedScreen", screenName);
      console.log("Selected Screen:", screenName); // Log the selected screen name
    } catch (error) {
      console.error("Error saving selected screen:", error);
    }
  };

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Home Screen</Text>
      <Button
        title="Case Builder"
        onPress={() => {
          saveSelectedScreen("Case Builder");
          navigation.navigate("Select Office Route");
        }}
      />
      <Button
        title="Package Helper"
        onPress={() => {
          saveSelectedScreen("Package Helper");
          navigation.navigate("Select Office Route");
        }}
      />
      <Button
        title="Profile"
        onPress={() => {
          saveSelectedScreen("Profile");
          navigation.navigate("Profile");
        }}
      />
      <Button title="Logout" onPress={signOut} />
    </View>
  );
}
