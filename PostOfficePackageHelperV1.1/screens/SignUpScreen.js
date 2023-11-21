import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";

export function SignUpScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [homePostOffice, setHomePostOffice] = useState("");
  const [position, setPosition] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = () => {
    // Create an object with the user's data
    const userData = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone_number: phoneNumber,
      home_post_office: homePostOffice,
      position: position,
      password: password,
    };

    // Send a POST request to the API to create a new user
    fetch("https://a961-71-85-245-93.ngrok-free.app/api/users/new", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })
      .then((response) => {
        if (response.status === 201) {
          // User was successfully created
          // You can navigate to another screen or show a success message here
        } else {
          // Handle other status codes (e.g., validation errors, server errors)
          // You can display an error message or handle them accordingly
        }
      })
      .catch((error) => {
        console.error("Error creating user:", error);
      });
  };

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Sign Up Screen</Text>
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
        placeholder="Home Post Office"
        value={homePostOffice}
        onChangeText={(text) => setHomePostOffice(text)}
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
      <Button title="Sign Up" onPress={handleSubmit} />
    </View>
  );
}
