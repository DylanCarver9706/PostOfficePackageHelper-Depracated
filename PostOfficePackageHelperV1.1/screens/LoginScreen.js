import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";
import { LogBox } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "../apiConfig";

export function LoginScreen({ setUser, navigation }) {
  const [email, setEmail] = useState("kristencarver14@gmail.com");
  const [password, setPassword] = useState("hashedsecurepassword");

  const handleLogin = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        // console.log(responseData);
        const { email, user_id } = responseData.user;

        // Save user information to AsyncStorage
        await AsyncStorage.setItem("userEmail", email);
        await AsyncStorage.setItem("userId", user_id.toString());

        // Login successful
        setUser(true);

        // Display user info in console log
        console.log("User Email:", email);
        console.log("User ID:", user_id);

        // Show a success toast
        Toast.show({
          text1: "Login Successful",
          type: "success",
        });

        // Force a full app reload
        LogBox.ignoreAllLogs(); // Ignore warnings to prevent errors during reload
        setTimeout(() => {
          // Reload the app after a delay
          navigation.reset({
            index: 0,
            routes: [{ name: "Home" }], // Navigate to the Home screen
          });
        }, 1000); // You can adjust the delay as needed
      } else {
        // Login failed
        setUser(null);

        // Show an error toast
        Toast.show({
          text1: "Login Failed",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error during login:", error);

      // Show an error toast
      Toast.show({
        text1: "An error occurred",
        type: "error",
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text>Login</Text>
      <TextInput
        placeholder="Email"
        onChangeText={(text) => setEmail(text)}
        value={email}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        onChangeText={(text) => setPassword(text)}
        value={password}
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
