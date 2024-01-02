import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
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
      submitted: false, // Add this property
    },
  ]);
  const [validationErrors, setValidationErrors] = useState([]);

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
    if (hasTextInInputs()) {
      // Show an alert to inform the user to press the "Add Post Office" button
      Alert.alert(
        "Confirmation Required",
        "Please add a Post Office using the 'Submit' button before adding another one",
        [{ text: "OK", onPress: () => {} }]
      );
      return;
    }
    const updatedPostOffices = [...postOffices];
    updatedPostOffices.push({
      user_id: userId,
      city: "",
      state: "",
      supervisor_name: "",
      supervisor_phone_number: "",
      postmaster_name: "",
      postmaster_phone_number: "",
      submitted: false, // Mark the office as not submitted
    });
    setPostOffices(updatedPostOffices);
  };

  const handleInputChange = (text, index, field) => {
    const updatedPostOffices = [...postOffices];
    updatedPostOffices[index][field] = text;
    setPostOffices(updatedPostOffices);
  };

  const validateForm = () => {
    const errors = [];

    postOffices.forEach((office, index) => {
      if (!office.city.trim()) {
        errors.push(`City is required`);
      }

      if (!office.state.trim()) {
        errors.push(`State is required`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmitOffice = (officeIndex) => {
    if (!validateForm()) {
      return; // Don't proceed if the form is not valid
    }
    
    const updatedPostOffices = [...postOffices];
    updatedPostOffices[officeIndex].submitted = true;
    setPostOffices(updatedPostOffices);
  };

  const handleCreatePostOffices = async () => {
    if (hasTextInInputs()) {
      // Show an alert to inform the user to press the "Add Post Office" button
      Alert.alert(
        "Confirmation Required",
        "Please add a Post Office using the 'Submit' button before trying to create the Post Office(s)",
        [{ text: "OK", onPress: () => {} }]
      );
      return;
    }

    let updatedPostOffices = [];
    for (let i = 0; i < postOffices.length; i++) {
      postOffices[i].user_id = userId;
      if (
        postOffices[i].city.trim() !== "" &&
        postOffices[i].state.trim() !== ""
      ) {
        updatedPostOffices.push(postOffices[i]);
      }
    }

    try {
      for (let index = 0; index < updatedPostOffices.length; index++) {
        const response = await fetch(`${API_BASE_URL}/offices`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedPostOffices[index]),
        });

        if (response.ok) {
          console.log("Post offices created successfully");
          navigation.navigate("New Route Screen");
        } else {
          console.error("Failed to create post offices");
        }
      }
    } catch (error) {
      console.error("Error creating post offices:", error);
    }
  };

  const hasTextInInputs = () => {
    for (let i = 0; i < postOffices.length; i++) {
      const office = postOffices[i];
      if (!office.submitted) {
        // Only check offices that have been submitted
        if (
          office.city.trim() !== "" ||
          office.state.trim() !== "" ||
          office.supervisor_name.trim() !== "" ||
          office.supervisor_phone_number.trim() !== "" ||
          office.postmaster_name.trim() !== "" ||
          office.postmaster_phone_number.trim() !== ""
        ) {
          return true;
        }
      }
    }
    return false;
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
              onChangeText={(text) =>
                handleInputChange(text, index, "supervisor_name")
              }
            />
            <TextInput
              placeholder="Supervisor Phone Number"
              onChangeText={(text) =>
                handleInputChange(text, index, "supervisor_phone_number")
              }
            />
            <TextInput
              placeholder="Postmaster Name"
              onChangeText={(text) =>
                handleInputChange(text, index, "postmaster_name")
              }
            />
            <TextInput
              placeholder="Postmaster Phone Number"
              onChangeText={(text) =>
                handleInputChange(text, index, "postmaster_phone_number")
              }
            />
            {office.submitted ? (
              <Button title="Submit" disabled />
            ) : (
              <Button
                title="Submit"
                onPress={() => handleSubmitOffice(index)}
              />
            )}
          </View>
        ))}
        <View>
          {validationErrors.map((error, index) => (
            <Text key={index} style={styles.errorText}>
              {error}
            </Text>
          ))}
        </View>
        <Button title="Add Post Office" onPress={handleAddPostOffice} />
        <Button title="Create Post Offices" onPress={handleCreatePostOffices} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  officeContainer: {
    marginBottom: 20,
  },
  errorText: {
    color: "red",
  },
});
