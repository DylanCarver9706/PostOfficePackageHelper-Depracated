import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "../apiConfig"; // Import your API base URL

export function NewOfficeAndRouteScreen() {
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
      submitted: false,
    },
  ]);
  const [routes, setRoutes] = useState([
    {
      office_id: "",
      route_number: "",
      submitted: false,
    },
  ]);
  const [offices, setOffices] = useState([]);
  const [selectedValues, setSelectedValues] = useState([""]);
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
    try {
      const response = await fetch(
        `${API_BASE_URL}/officesByUserId?user_id=${userId}`
      );
      if (response.ok) {
        const officeData = await response.json();
        setOffices(officeData);
        formatOfficesForDropdown(officeData); // Format offices for dropdown
      } else {
        console.error("Failed to fetch offices");
      }
    } catch (error) {
      console.error("Error fetching offices:", error);
    }
  };

  const handleAddPostOffice = () => {
    if (hasTextInInputs(postOffices)) {
      Alert.alert(
        "Confirmation Required",
        "Please add a Post Office using the 'Submit Post Office' button before adding another one",
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
      submitted: false,
    });
    setPostOffices(updatedPostOffices);
  };

  const handleAddRoute = () => {
    if (hasTextInInputs(routes)) {
      Alert.alert(
        "Confirmation Required",
        "Please add a Route using the 'Add Route' button before adding another one",
        [{ text: "OK", onPress: () => {} }]
      );
      return;
    }

    const updatedRoutes = [...routes];
    updatedRoutes.push({
      office_id: selectedValues[0],
      route_number: routeNumber,
      submitted: false,
    });
    setSelectedValues([""]);
    setRouteNumber("");
    setRoutes(updatedRoutes);
  };

  const handleInputChange = (text, index, field, isRoute) => {
    const items = isRoute ? [...routes] : [...postOffices];
    items[index][field] = text;
    isRoute ? setRoutes(items) : setPostOffices(items);
  };

  const validateForm = (items) => {
    const errors = [];

    // items.forEach((item, index) => {
    //   if (!item.city?.trim() && !item.state?.trim()) {
    //     errors.push(`City and State are required for item ${index + 1}`);
    //   }
    // });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmitPostOffice = (officeIndex) => {
    if (!validateForm(postOffices)) {
      return;
    }

    const updatedPostOffices = [...postOffices];
    updatedPostOffices[officeIndex].submitted = true;
    setPostOffices(updatedPostOffices);

    // Add the submitted post office to the dropdown options
    const submittedOffice = updatedPostOffices[officeIndex];
    if (submittedOffice.city && submittedOffice.state) {
      const formattedOffice = {
        key: `${submittedOffice.city}-${submittedOffice.state}`,
        value: `${submittedOffice.city}, ${submittedOffice.state}`,
      };
      setFormattedOffices((prevOptions) => [...prevOptions, formattedOffice]);
    }
  };

  const handleSubmitRoute = (routeIndex) => {
    if (!validateForm(routes)) {
      return;
    }

    const updatedRoutes = [...routes];
    updatedRoutes[routeIndex].submitted = true;
    setRoutes(updatedRoutes);
  };

  const handleCreatePostOfficesAndRoutes = async () => {
    if (hasTextInInputs(postOffices) || hasTextInInputs(routes)) {
      Alert.alert(
        "Confirmation Required",
        "Please add a Post Office and a Route using their respective buttons before trying to create them",
        [{ text: "OK", onPress: () => {} }]
      );
      return;
    }

    const updatedPostOffices = postOffices.filter(
      (office) => office.city?.trim() && office.state?.trim()
    );

    const updatedRoutes = routes.filter(
      (route) => route.office_id && route.route_number.trim()
    );

    try {
      for (let index = 0; index < updatedPostOffices.length; index++) {
        const response = await fetch(`${API_BASE_URL}/offices`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedPostOffices[index]),
        });

        if (!response.ok) {
          console.error("Failed to create post offices");
          return;
        }
      }

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

        if (!response.ok) {
          console.error("Failed to create routes");
          return;
        }
      }

      console.log("Post offices and routes created successfully");
      navigation.navigate("Account Created Screen");
    } catch (error) {
      console.error("Error creating post offices and routes:", error);
    }
  };

  const hasTextInInputs = (items) => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.submitted) {
        if (item.city?.trim() || item.state?.trim() || item.route_number.trim()) {
          return true;
        }
      }
    }
    return false;
  };

  const formatOfficesForDropdown = (officeData) => {
    const formattedOptions = officeData.map((office) => ({
      key: `${office.city}-${office.state}`,
      value: `${office.city}, ${office.state}`,
    }));
    setFormattedOffices(formattedOptions);
  };

  return (
    <ScrollView style={styles.container}>
      <Text>What are the main offices and routes you work on?</Text>
      <Text>Tip: You can add more later</Text>

      {postOffices.map((office, index) => (
        <View key={index} style={styles.inputContainer}>
          <Text>Post Office {index + 1}</Text>
          <TextInput
            placeholder="City"
            onChangeText={(text) => handleInputChange(text, index, "city", false)}
          />
          <TextInput
            placeholder="State"
            onChangeText={(text) => handleInputChange(text, index, "state", false)}
          />
          <TextInput
            placeholder="Supervisor Name"
            onChangeText={(text) => handleInputChange(text, index, "supervisor_name", false)}
          />
          <TextInput
            placeholder="Supervisor Phone Number"
            onChangeText={(text) => handleInputChange(text, index, "supervisor_phone_number", false)}
          />
          <TextInput
            placeholder="Postmaster Name"
            onChangeText={(text) => handleInputChange(text, index, "postmaster_name", false)}
          />
          <TextInput
            placeholder="Postmaster Phone Number"
            onChangeText={(text) => handleInputChange(text, index, "postmaster_phone_number", false)}
          />
          {office.submitted ? (
            <Button title="Submit Post Office" disabled />
          ) : (
            <Button title="Submit Post Office" onPress={() => handleSubmitPostOffice(index)} />
          )}
        </View>
      ))}

      {routes.map((route, index) => (
        <View key={index} style={styles.inputContainer}>
          <Text>Route {index + 1}</Text>
          <SelectList
            setSelected={(values) => setSelectedValues(values)}
            data={formattedOffices}
            placeholder="Offices"
            selectedValues={route.office_id ? [route.office_id] : []}
          />
          <TextInput
            placeholder="Route Number"
            onChangeText={(text) => handleInputChange(text, index, "route_number", true)}
          />
          {route.submitted ? (
            <Button title="Submit Route" disabled />
          ) : (
            <Button title="Submit Route" onPress={() => handleSubmitRoute(index)} />
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
      <Button title="Add Route" onPress={handleAddRoute} />
      <Button title="Create Offices and Routes" onPress={handleCreatePostOfficesAndRoutes} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  errorText: {
    color: "red",
  },
});
