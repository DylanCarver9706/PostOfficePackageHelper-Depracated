import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  Button,
  Modal,
  TextInput,
  Alert,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import API_BASE_URL from "../apiConfig";

const ProfileScreen = () => {
  const [userData, setUserData] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [updatedUserInfo, setUpdatedUserInfo] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    position: "",
  });

  const navigation = useNavigation();

  // Function to fetch user data from the API
  const fetchUserData = async () => {
    try {
      userId = await AsyncStorage.getItem("userId");
      const response = await fetch(`${API_BASE_URL}/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      } else {
        console.error("Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // Load user data when the component mounts
  useEffect(() => {
    fetchUserData();
  }, []);

  // Function to handle opening the edit modal
  const handleOpenEditModal = () => {
    setUpdatedUserInfo({
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      phone_number: userData.phone_number,
      position: userData.position,
    });
    setIsEditModalVisible(true);
  };

  // Function to handle closing the edit modal
  const handleCloseEditModal = () => {
    setIsEditModalVisible(false);
  };

  // Function to handle updating user information
  const handleUpdateProfile = async () => {
    if (!validateForm()) {
      return; // Don't proceed if the form is not valid
    }

    try {
      userId = await AsyncStorage.getItem("userId");
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedUserInfo),
      });
      if (response.ok) {
        // Reload user data after update
        fetchUserData();
        // Close the edit modal
        handleCloseEditModal();
      } else {
        console.error("Failed to update user data");
      }
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  };

  // Function to handle deleting the user profile
  const handleDeleteProfile = async () => {
    try {
      userId = await AsyncStorage.getItem("userId");

      // Display a confirmation alert before deleting the profile
      Alert.alert(
        "Delete Profile",
        "Are you sure you want to delete your profile?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            onPress: async () => {
              const response = await fetch(
                `${API_BASE_URL}/users/delete/${userId}`,
                {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ active_status: 0 }),
                }
              );

              if (response.ok) {
                // Clear user data from AsyncStorage
                await AsyncStorage.clear();
                // Navigate to the login screen or any other screen
                navigation.navigate("HaveAccountScreen");
              } else {
                console.error("Failed to delete user profile");
              }
            },
            style: "destructive",
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error("Error deleting user profile:", error);
    }
  };

  const validateForm = () => {
    const errors = [];

    // Email validation regex pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!updatedUserInfo.first_name.trim()) {
      errors.push("First Name is required");
    }

    if (!updatedUserInfo.last_name.trim()) {
      errors.push("Last Name is required");
    }

    if (!updatedUserInfo.email.trim()) {
      errors.push("Email is required");
    } else if (!emailPattern.test(updatedUserInfo.email)) {
      errors.push("Email is not valid");
    }

    if (!updatedUserInfo.phone_number.trim()) {
      errors.push("Phone Number is required");
    } else if (!/^\d{10}$/.test(updatedUserInfo.phone_number)) {
      errors.push("Phone Number must be exactly 10 digits");
    }

    // Add more validation rules as needed for other fields

    setValidationErrors(errors);
    return errors.length === 0;
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {userData ? (
        <>
          <Text>First Name: {userData.first_name}</Text>
          <Text>Last Name: {userData.last_name}</Text>
          <Text>Email: {userData.email}</Text>
          <Text>Phone Number: {userData.phone_number}</Text>
          <Text>Position: {userData.position}</Text>
          <Button title="Edit Profile" onPress={handleOpenEditModal} />
          <Button title="Delete Profile" onPress={handleDeleteProfile} />
        </>
      ) : (
        <Text>Loading user data...</Text>
      )}

      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <View style={{ backgroundColor: "white", padding: 20 }}>
            <View>
              {validationErrors.map((error, index) => (
                <Text key={index} style={styles.errorText}>
                  {error}
                </Text>
              ))}
            </View>
            <TextInput
              placeholder="First Name"
              value={updatedUserInfo.first_name}
              onChangeText={(text) =>
                setUpdatedUserInfo({ ...updatedUserInfo, first_name: text })
              }
            />
            <TextInput
              placeholder="Last Name"
              value={updatedUserInfo.last_name}
              onChangeText={(text) =>
                setUpdatedUserInfo({ ...updatedUserInfo, last_name: text })
              }
            />
            <TextInput
              placeholder="Email"
              value={updatedUserInfo.email}
              onChangeText={(text) =>
                setUpdatedUserInfo({ ...updatedUserInfo, email: text })
              }
            />
            <TextInput
              placeholder="Phone Number"
              value={updatedUserInfo.phone_number}
              onChangeText={(text) =>
                setUpdatedUserInfo({ ...updatedUserInfo, phone_number: text })
              }
            />
            <TextInput
              placeholder="Position"
              value={updatedUserInfo.position}
              onChangeText={(text) =>
                setUpdatedUserInfo({ ...updatedUserInfo, position: text })
              }
            />
            <Button title="Save" onPress={handleUpdateProfile} />
            <Button title="Cancel" onPress={handleCloseEditModal} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  errorText: {
    color: "red",
    marginBottom: 10,
  },
  // ... other styles ...
});
