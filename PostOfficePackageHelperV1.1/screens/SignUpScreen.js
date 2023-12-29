import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "../apiConfig";
import { FIREBASE_AUTH } from "../FirebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";

export function SignUpScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [position, setPosition] = useState("");
  const [password, setPassword] = useState("");
  const auth = FIREBASE_AUTH;

  const navigation = useNavigation();

  const signUp = async () => {
    try {
      const user = await createUserWithEmailAndPassword(auth, email, password);
      if (user) {
        // User was successfully created in firebase
        // console.log("user: " + JSON.stringify(user, null, 2));
        // Create an object with the user's data
        const userData = {
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone_number: phoneNumber,
          position: position,
          firebase_user_uid: user.user.uid
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
          // Store user ID securely (e.g., using AsyncStorage)
          await AsyncStorage.setItem("userId", newUserData.user.id.toString());
          await AsyncStorage.setItem("userEmail", newUserData.user.email);
          await AsyncStorage.setItem("userFirebaseUid", newUserData.user.firebase_user_uid);
        }
      }
    } catch (error) {
      console.error("Error during sign in:", error);
    } finally {
      navigation.navigate("New Office Screen");
    }
  };

  const signUp = async () => {
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
        const user = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        console.log("user: " + JSON.stringify(user, null, 2));
      }
    } catch (error) {
      console.error("Error during sign in:", error);
    } finally {
      navigation.navigate("New Office Screen");
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
      <Button title="Next" onPress={signUp} />
    </View>
  );
}
