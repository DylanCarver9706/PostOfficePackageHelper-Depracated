import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, ScrollView, Alert, StyleSheet } from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "../apiConfig"; // Import your API base URL

export function NewRouteScreen() {
  const [userId, setUserId] = useState(null);
  const [routes, setRoutes] = useState([
    { office_id: "", route_number: "", submitted: false }, // Initial input fields
  ]);
  const [offices, setOffices] = useState([]); // To store the list of offices
  const [selectedValues, setSelectedValues] = useState([""]); // Array to store selected office IDs for each route
  const [formattedOffices, setFormattedOffices] = useState([]);
  const [routeNumber, setRouteNumber] = useState("");
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

  useEffect(() => {
    handleFetchOffices();
  }, [userId]);

  const handleFetchOffices = async () => {
    // Fetch the list of offices from your API and set them in the state
    try {
      const response = await fetch(
        `${API_BASE_URL}/officesByUserId?user_id=${userId}`
      );
      if (response.ok) {
        const officeData = await response.json();
        // console.log(officeData)
        setOffices(officeData);
      } else {
        console.error("Failed to fetch offices");
      }
    } catch (error) {
      console.error("Error fetching offices:", error);
    }
  };

  const handleAddRoute = () => {
    if (!validateForm()) {
      return; // Don't proceed if the form is not valid
    }
  
    const newRoute = {
      office_id: selectedValues[0], // Use the selected office for this route
      route_number: routeNumber,
      submitted: false, // Mark the route as not submitted
    };
  
    const updatedRoutes = [...routes, newRoute];
    setSelectedValues([""]);
    setRouteNumber("");
    setRoutes(updatedRoutes);
  };

  const handleInputChange = (text, index, field) => {
    const updatedRoutes = [...routes];
    updatedRoutes[index][field] = text;
    setRoutes(updatedRoutes);
  };

  const validateForm = () => {
    const errors = [];

    routes.forEach((route, index) => {

      if (!route.route_number.trim()) {
        errors.push(`Office and Route Number are required`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmitRoute = (routeIndex) => {
    if (!validateForm()) {
      return; // Don't proceed if the form is not valid
    }

    const updatedRoutes = [...routes];
    updatedRoutes[routeIndex].submitted = true;
    console.log(updatedRoutes)
    setRoutes(updatedRoutes);
  };

  const handleCreateRoutes = async () => {
    if (hasTextInInputs()) {
      // Show an alert to inform the user to press the "Add Route" button
      Alert.alert(
        "Confirmation Required",
        "Please add a Route using the 'Add Route' button before trying to create the Route(s)",
        [{ text: "OK", onPress: () => {} }]
      );
      return;
    }
    console.log(routes)

    let updatedRoutes = [];
    for (let i = 0; i < routes.length; i++) {
      routes[i].user_id = userId;
      if (routes[i].office_id && routes[i].route_number.trim() !== "") {
        updatedRoutes.push(routes[i]);
      }
    }
    console.log(updatedRoutes)

    try {
      for (let index = 0; index < updatedRoutes.length; index++) {
        const response = await fetch(`${API_BASE_URL}/routes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            office_id: updatedRoutes[index].office_id,
            route_number: updatedRoutes[index].route_number,
          }),
        });

        if (response.ok) {
          console.log("Routes created successfully");
          navigation.navigate("Account Created Screen");
        } else {
          console.error("Failed to create routes");
        }
      }
    } catch (error) {
      console.error("Error creating routes:", error);
    }
  };

  const formatOfficesForDropdown = async () => {
    let formattedOffices = [];
    for (let i = 0; i < offices.length; i++) {
      formattedOffices.push({
        key: offices[i].office_id,
        // label: offices[i].city, // Displayed label for the dropdown option
        value: offices[i].city, // Actual value to be stored in the state
      });
    }
    setFormattedOffices(formattedOffices);
  };

  useEffect(() => {
    formatOfficesForDropdown();
  }, [offices]);

  const hasTextInInputs = () => {
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      if (!route.submitted) {
        // Only check routes that have not been submitted
        if (route.office_id || route.route_number.trim() !== "") {
          return true;
        }
      }
    }
    return false;
  };

  return (
    <View>
      <Text>What are the routes you work on?</Text>
      <Text>Tip: You can add more later</Text>
      <ScrollView>
        {routes.map((route, index) => (
          <View key={index}>
            <Text>Route {index + 1}</Text>
            <SelectList
              setSelected={(values) => setSelectedValues(values)}
              data={formattedOffices}
              placeholder="Offices"
              selectedValues={route.office_id ? [route.office_id] : []}
            />
            <TextInput
              placeholder="Route Number"
              onChangeText={(text) => handleInputChange(text, index, "route_number")}
            />
            {route.submitted ? (
              <Button title="Submit" disabled />
            ) : (
              <Button title="Submit" onPress={() => handleSubmitRoute(index)} />
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
        <Button title="Add Route" onPress={handleAddRoute} />
        <Button title="Create Routes" onPress={handleCreateRoutes} />
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
