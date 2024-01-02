import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import API_BASE_URL from "../apiConfig";
import { FIREBASE_AUTH } from "../FirebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";

export function LoginScreen() {
  const [email, setEmail] = useState("dylancarver14@gmail.com");
  const [password, setPassword] = useState("Dtc+Kem2016");
  const [validationErrors, setValidationErrors] = useState([]);

  const auth = FIREBASE_AUTH;
  const navigation = useNavigation();

  const validateForm = () => {
    const errors = [];

    if (!email || !email.trim()) {
      errors.push("Email is required");
    }

    if (!password || !password.trim()) {
      errors.push("Password is required");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const signIn = async () => {
    if (!validateForm()) {
      return; // Don't proceed if the form is not valid
    }
  
    try {
      const user = await signInWithEmailAndPassword(auth, email, password);
      if (user) {
        // User was successfully created in Firebase
        const response = await fetch(
          `${API_BASE_URL}/afterLoginUserData?email=${email}&firebase_user_uid=${user.user.uid}`
        );
        if (response.status === 200) {
          const userData = await response.json();
          // Store user ID securely (e.g., using AsyncStorage)
          await AsyncStorage.setItem("userId", userData.user_id.toString());
          await AsyncStorage.setItem("userEmail", userData.email);
          await AsyncStorage.setItem("userFirebaseUid", userData.firebase_user_uid);
          navigation.navigate("Home");
        }
      }
    } catch (error) {
      if (error.code === "auth/invalid-credential") {
        setValidationErrors(["Invalid email or password"]);
      } else if (error.code === "auth/invalid-email") {
        setValidationErrors(["Email not valid"]);
      } else {
        console.error("Error during sign in:", error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text>Login</Text>
      <TextInput
        placeholder="Email"
        onChangeText={(text) => setEmail(text.trim())}
        value={email}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        onChangeText={(text) => setPassword(text.trim())}
        value={password}
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
      <Button title="Login" onPress={signIn} />
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
