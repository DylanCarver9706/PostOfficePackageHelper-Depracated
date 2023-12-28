import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, ScrollView } from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "../apiConfig"; // Import your API base URL

export function NewRouteScreen() {
  const [userId, setUserId] = useState(null);
  const [routes, setRoutes] = useState([
    { office_id: "", route_number: "" }, // Initial input fields
  ]);
  const [offices, setOffices] = useState([]); // To store the list of offices
  const [selectedValues, setSelectedValues] = useState([""]); // Array to store selected office IDs for each route
  const [formattedOffices, setFormattedOffices] = useState([]);
  const [routeNumber, setRouteNumber] = useState("");

  const navigation = useNavigation();

  const handlefetchUserId = async () => {
    try {
      const id = await AsyncStorage.getItem("userId");
      setUserId(id); // Fetch offices when the component mounts
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
    // console.log(userId);
    try {
      const response = await fetch(
        `${API_BASE_URL}/officesByUserId?user_id=${userId}`
      );
      if (response.ok) {
        const officeData = await response.json();
        // console.log(officeData);
        setOffices(officeData);
      } else {
        console.error("Failed to fetch offices");
      }
    } catch (error) {
      console.error("Error fetching offices:", error);
    }
  };

  const handleAddRoute = () => {
    // Add a new empty route object to the state
    setRoutes([
      ...routes,
      { office_id: selectedValues, route_number: routeNumber },
    ]);
    setSelectedValues([""]);
    setRouteNumber("");
    // console.log("offices: " + JSON.stringify(offices, null, 2));
    // console.log("routes: " + JSON.stringify(routes, null, 2));
  };

  const handleCreateRoutes = async () => {
    try {
      const updatedRoutes = routes.filter(
        (route) => route.route_number !== "" && route.office_id !== ""
      );

      for (let index = 0; index < updatedRoutes.length; index++) {
        // Send a POST request to create routes
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
          // Handle success
          console.log("Routes created successfully");
          // Optionally, navigate to another screen or perform other actions
        } else {
          // Handle errors
          console.error("Failed to create routes");
        }
      }
      navigation.navigate("Account Created Screen");
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

  return (
    <View>
      <Text>What are the routes you work on?</Text>
      <Text>Tip: You can add more later</Text>
      <ScrollView>
        {routes.map((route, index) => (
          <View key={index}>
            <Text>Route {index + 1}</Text>
            <SelectList
              setSelected={setSelectedValues}
              data={formattedOffices}
              placeholder="Offices"
            />
            <TextInput
              placeholder="Route Number"
              onChangeText={(text) => setRouteNumber(text)}
            />
          </View>
        ))}
        <Button title="Add Route" onPress={handleAddRoute} />
        <Button title="Create Routes" onPress={handleCreateRoutes} />
      </ScrollView>
    </View>
  );
}
