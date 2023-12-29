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
  const auth = FIREBASE_AUTH;

  const navigation = useNavigation();

  const signIn = async () => {
    try {
      const user = await signInWithEmailAndPassword(auth, email, password);
      if (user) {
        // User was successfully created in firebase
        console.log("user: " + JSON.stringify(user, null, 2));
        const response = await fetch(
          `${API_BASE_URL}/afterLoginUserData?email=${email}&firebase_user_uid=${user.user.uid}`
        );
        console.log(response.status);
        if (response.status === 200) {
          // User was successfully created
          const userData = await response.json();
          console.log(userData);
          // Store user ID securely (e.g., using AsyncStorage)
          await AsyncStorage.setItem("userId", userData.user_id.toString());
          await AsyncStorage.setItem("userEmail", userData.email);
          await AsyncStorage.setItem("userFirebaseUid", userData.firebase_user_uid);
        }
      }
    } catch (error) {
      console.error("Error during sign in:", error);
    } finally {
      navigation.navigate("Home");
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
});
