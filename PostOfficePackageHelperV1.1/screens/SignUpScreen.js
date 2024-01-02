import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
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
  const [validationErrors, setValidationErrors] = useState([]);

  const auth = FIREBASE_AUTH;
  const navigation = useNavigation();

  const validateForm = () => {
    const errors = [];

    // Email validation regex pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Password validation regex pattern
    const passwordPattern = /^(?=.*\d)(?=.*[!@#$%^&+*])(?=.*[a-zA-Z]).{8,}$/;

    if (!firstName.trim()) {
      errors.push("First Name is required");
    }

    if (!lastName.trim()) {
      errors.push("Last Name is required");
    }

    if (!email.trim()) {
      errors.push("Email is required");
    } else if (!emailPattern.test(email)) {
      errors.push("Email is not valid");
    }

    // if (!phoneNumber.trim()) {
    //   errors.push("Phone Number is required");
    // }

    // if (!position.trim()) {
    //   errors.push("Position is required");
    // }

    if (!password.trim()) {
      errors.push("Password is required");
    } else if (!passwordPattern.test(password)) {
      errors.push("Password must be at least 8 characters long + contain at least one number and one special character");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const signUp = async () => {
    if (!validateForm()) {
      return; // Don't proceed if the form is not valid
    }

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
          // console.log(newUserData);

          // Store user ID securely (e.g., using AsyncStorage)
          await AsyncStorage.setItem("userId", newUserData.user.id.toString());
          await AsyncStorage.setItem("userEmail", newUserData.user.email);
          await AsyncStorage.setItem("userFirebaseUid", newUserData.user.firebase_user_uid);
          // navigation.navigate("New Office Screen");
          navigation.navigate("New Office and Route Screen");
        }
      }
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setValidationErrors(["Email already associated to an account"]);
      } else {
        console.error("Error during sign in:", error);
      }
    }
  };

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Let's start off by getting some basic information...</Text>
      <TextInput
        placeholder="First Name"
        value={firstName}
        onChangeText={(text) => setFirstName(text.trim())}
      />
      <TextInput
        placeholder="Last Name"
        value={lastName}
        onChangeText={(text) => setLastName(text.trim())}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={(text) => setEmail(text.trim())}
      />
      <TextInput
        placeholder="Phone Number"
        value={phoneNumber}
        onChangeText={(text) => setPhoneNumber(text.trim())}
      />
      <TextInput
        placeholder="Position"
        value={position}
        onChangeText={(text) => setPosition(text.trim())}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry={true}
        value={password}
        onChangeText={(text) => setPassword(text.trim())}
      />
      {validationErrors.length > 0 && (
        <View>
          {validationErrors.map((error, index) => (
            <Text key={index} style={styles.errorText}>
              {error}
            </Text>
          ))}
        </View>
      )}
      <Button title="Next" onPress={signUp} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
});