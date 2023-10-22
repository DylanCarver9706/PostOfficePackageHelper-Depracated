import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";
import { LogBox } from "react-native";

export function LoginScreen({ setUser, navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    // console.log("Login button pressed");

    try {
      const response = await fetch(
        "https://4beb-71-85-245-93.ngrok-free.app/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

    //   console.log("Response status:", response.status);
    //   const responseData = await response.json();
    //   console.log("Whole response: ", responseData);

      if (response.ok) {
        // Login successful
        setUser(true);

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
