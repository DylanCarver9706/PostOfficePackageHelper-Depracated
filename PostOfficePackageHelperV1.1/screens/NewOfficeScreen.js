import React, { useState } from "react";
import { View, Text, TextInput, Button, ScrollView } from "react-native";
import API_BASE_URL from "../apiConfig"; // Import your API base URL

export function NewOfficeScreen() {
  const [postOffices, setPostOffices] = useState([
    { city: "", state: "", phone_number: "" }, // Initial input fields
  ]);

  const handleAddPostOffice = () => {
    // Add a new empty post office object to the state
    setPostOffices([...postOffices, { city: "", state: "", phone_number: "" }]);
  };

  const handleInputChange = (text, index, field) => {
    // Update the input field of the specified post office
    const updatedPostOffices = [...postOffices];
    updatedPostOffices[index][field] = text;
    setPostOffices(updatedPostOffices);
  };

  const handleCreatePostOffices = async () => {
    try {
      // Send a POST request to create post offices
      const response = await fetch(`${API_BASE_URL}/postOffices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postOffices),
      });

      if (response.ok) {
        // Handle success
        console.log("Post offices created successfully");
        // Optionally, navigate to another screen or perform other actions
      } else {
        // Handle errors
        console.error("Failed to create post offices");
      }
    } catch (error) {
      console.error("Error creating post offices:", error);
    }
  };

  return (
    <ScrollView>
      {postOffices.map((office, index) => (
        <View key={index}>
          <Text>Post Office {index + 1}</Text>
          <TextInput
            placeholder="City"
            value={office.city}
            onChangeText={(text) => handleInputChange(text, index, "city")}
          />
          <TextInput
            placeholder="State"
            value={office.state}
            onChangeText={(text) => handleInputChange(text, index, "state")}
          />
          <TextInput
            placeholder="Phone Number"
            value={office.phone_number}
            onChangeText={(text) =>
              handleInputChange(text, index, "phone_number")
            }
          />
        </View>
      ))}
      <Button title="Add Post Office" onPress={handleAddPostOffice} />
      <Button title="Create Post Offices" onPress={handleCreatePostOffices} />
    </ScrollView>
  );
}
