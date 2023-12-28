import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "../apiConfig";

export function SignUpScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [position, setPosition] = useState("");
  const [password, setPassword] = useState("");

  const navigation = useNavigation();

  const handleSubmit = async () => {
    try {
      // Create an object with the user's data
      const userData = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone_number: phoneNumber,
        position: position,
        password: password,
      };

      // Send a POST request to the API to create a new user
      const newUserResponse = await fetch(`${API_BASE_URL}/users/new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (newUserResponse.status === 201) {
        // User was successfully created
        const newUserData = await newUserResponse.json();
        console.log(newUserData);

        const loginInfo = {
          email: email, // Note: Use the email provided in the form, not from the response
          password: password, // Note: Use the password provided in the form, not stored in client-side storage
        };

        // Send a POST request to log in the newly created user
        const loginResponse = await fetch(`${API_BASE_URL}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loginInfo),
        });

        if (loginResponse.status === 200) {
          const data = await loginResponse.json();
          console.log("User logged in data: " + JSON.stringify(data));

          // Store user ID securely (e.g., using AsyncStorage)
          await AsyncStorage.setItem("userId", data.user.user_id.toString());
          await AsyncStorage.setItem("userEmail", data.user.email);

          // Optionally, navigate to another screen or perform other actions
          navigation.navigate("New Office Screen");
        } else {
          // Handle other status codes (e.g., validation errors, server errors)
          // You can display an error message or handle them accordingly
          console.error("Error logging in user:", loginResponse.statusText);
        }
      } else {
        // Handle other status codes (e.g., validation errors, server errors)
        // You can display an error message or handle them accordingly
        console.error("Error creating user:", newUserResponse.statusText);
      }
    } catch (error) {
      console.error("Error creating or logging in user:", error);
    }
  };

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Let's start off by getting some basic information...</Text>
      <TextInput
        placeholder="First Name"
        value={firstName}
        onChangeText={(text) => setFirstName(text)}
      />
      <TextInput
        placeholder="Last Name"
        value={lastName}
        onChangeText={(text) => setLastName(text)}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={(text) => setEmail(text)}
      />
      <TextInput
        placeholder="Phone Number"
        value={phoneNumber}
        onChangeText={(text) => setPhoneNumber(text)}
      />
      {/* <TextInput
        placeholder="Home Post Office"
        value={homePostOffice}
        onChangeText={(text) => setHomePostOffice(text)}
      />
      <TextInput
        placeholder="Home Route"
        value={homeRoute}
        onChangeText={(text) => setHomeRoute(text)}
      /> */}
      <TextInput
        placeholder="Position"
        value={position}
        onChangeText={(text) => setPosition(text)}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry={true}
        value={password}
        onChangeText={(text) => setPassword(text)}
      />
      <Button title="Next" onPress={handleSubmit} />
    </View>
  );
}
