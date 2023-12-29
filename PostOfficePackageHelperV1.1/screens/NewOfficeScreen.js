import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "../apiConfig"; // Import your API base URL

export function NewOfficeScreen() {
  const [userId, setUserId] = useState(null);
  const [postOffices, setPostOffices] = useState([
    {
      user_id: userId,
      city: "",
      state: "",
      supervisor_name: "",
      supervisor_phone_number: "",
      postmaster_name: "",
      postmaster_phone_number: "",
    },
  ]);

  const navigation = useNavigation();

  const handlefetchUserId = async () => {
    try {
      const id = await AsyncStorage.getItem("userId");
      setUserId(id);
    } catch (error) {
      console.error("Error retrieving user information:", error);
    }
  };

  useEffect(() => {
    handlefetchUserId();
  }, []);

  const handleAddPostOffice = () => {
    // console.log(userId);
    // Add a new empty post office object to the state
    setPostOffices([
      ...postOffices,
      {
        user_id: userId,
        city: "",
        state: "",
        supervisor_name: "",
        supervisor_phone_number: "",
        postmaster_name: "",
        postmaster_phone_number: "",
      },
    ]);
  };

  const handleInputChange = (text, index, field) => {
    // Update the input field of the specified post office
    const updatedPostOffices = [...postOffices];
    updatedPostOffices[index][field] = text;
    setPostOffices(updatedPostOffices);
  };

  const handleCreatePostOffices = async () => {
    // console.log(postOffices);
    let updatedPostOffices = [];
    for (let i = 0; i < postOffices.length; i++) {
      postOffices[i].user_id = userId;
      if (
        postOffices[i].city != "" &&
        postOffices[i].state != ""
      ) {
        updatedPostOffices.push(postOffices[i]);
      }
    }
    // console.log(updatedPostOffices);
    try {
      for (let index = 0; index < updatedPostOffices.length; index++) {
        // Send a POST request to create post offices
        const response = await fetch(`${API_BASE_URL}/offices`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedPostOffices[index]),
        });

        if (response.ok) {
          // Handle success
          console.log("Post offices created successfully");
          // Optionally, navigate to another screen or perform other actions
          navigation.navigate("New Route Screen");
        } else {
          // Handle errors
          console.error("Failed to create post offices");
        }
      }
    } catch (error) {
      console.error("Error creating post offices:", error);
    }
  };

  return (
    <View>
      <Text>What are the main offices you work at?</Text>
      <Text>Tip: You can add more later</Text>
      <ScrollView>
        {postOffices.map((office, index) => (
          <View key={index}>
            <Text>Post Office {index + 1}</Text>
            <TextInput
              placeholder="City"
              onChangeText={(text) => handleInputChange(text, index, "city")}
            />
            <TextInput
              placeholder="State"
              onChangeText={(text) => handleInputChange(text, index, "state")}
            />


            <TextInput
              placeholder="Supervisor Name"
              onChangeText={(text) => handleInputChange(text, index, "supervisor_name")}
            />
            <TextInput
              placeholder="Supervisor Phone Number"
              onChangeText={(text) => handleInputChange(text, index, "supervisor_phone_number")}
            />
            <TextInput
              placeholder="Postmaster Name"
              onChangeText={(text) => handleInputChange(text, index, "postmaster_name")}
            />
            <TextInput
              placeholder="Postmaster Phone Number"
              onChangeText={(text) => handleInputChange(text, index, "postmaster_phone_number")}
            />
          </View>
        ))}
        <Button title="Add Post Office" onPress={handleAddPostOffice} />
        <Button title="Create Post Offices" onPress={handleCreatePostOffices} />
      </ScrollView>
    </View>
  );
}
