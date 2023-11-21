import React, { useState, useEffect } from "react";
import { View, Text, Button, LogBox } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

export function HomeScreen({ setUser }) {
  const [user_id, setUserId] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const email = await AsyncStorage.getItem("userEmail");
        const id = await AsyncStorage.getItem("userId");

        if (email && id) {
          setUserId(id);
        }
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
        `https://a961-71-85-245-93.ngrok-free.app/api/logout?user_id=${user_id}`,
        {
          method: "GET",
        }
      );

      if (response.ok) {
        setUser(null);
        LogBox.ignoreAllLogs();
        navigation.replace("HaveAccountScreen");
        console.log("Logout successful");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error logging out:", error);
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
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}
