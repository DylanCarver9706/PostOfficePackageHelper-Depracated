import React, { useState, useEffect } from "react";
import { View, Text, Button, LogBox } from "react-native";

// Import the necessary modules for handling authentication and navigation
import AsyncStorage from "@react-native-async-storage/async-storage"; // For storing user data
import { useNavigation } from "@react-navigation/native"; // For navigation

// Define the HomeScreen component
export function HomeScreen({ setUser }) {

  const [user_id, setUserId] = useState([]);

  const navigation = useNavigation();

  useEffect(() => {
    // Retrieve user information from AsyncStorage
    const getUserInfo = async () => {
      try {
        const email = await AsyncStorage.getItem("userEmail");
        const id = await AsyncStorage.getItem("userId");

        // console.log("Email in Home: ", email);
        // console.log("Id in Home: ", id);
        if (email && id) {
          // setUserEmail(email);
          setUserId(id);
        }
      } catch (error) {
        console.error("Error retrieving user information:", error);
      }
    };

    getUserInfo();
  }, []);

  // Define the handleLogout function
  const handleLogout = async () => {
    // Perform any necessary cleanup (e.g., clearing user data from AsyncStorage)
    try {
      await AsyncStorage.clear(); // Clear user data from AsyncStorage

      // Send a request to the /api/logout endpoint
      const response = await fetch(
        `https://ff4b-71-85-245-93.ngrok-free.app/api/logout?user_id=${user_id}`,
        {
          method: "GET", // You can adjust the HTTP method as needed
        }
      );

      if (response.ok) {
        // Set the user state to null upon successful logout
        setUser(null);

        // Force a full app reload if the logout was successful
        LogBox.ignoreAllLogs(); // Ignore warnings to prevent errors during reload
        navigation.replace("HaveAccountScreen");
        console.log("Logout successful");
      } else {
        // Handle the case where logout fails
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error logging out:", error);
      // Handle any errors that occur during the logout process
    }
  };

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Home Screen</Text>
      <Button
        title="Case Builder"
        onPress={() => navigation.navigate("Select Office Route")}
      />
      <Button
        title="Package Helper"
        onPress={() => navigation.navigate("Package Helper")}
      />
      <Button
        title="Logout"
        onPress={handleLogout} // Call the handleLogout function when the button is pressed
      />
    </View>
  );
}
