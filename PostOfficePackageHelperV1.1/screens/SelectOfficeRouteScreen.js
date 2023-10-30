import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function SelectOfficeRouteScreen() {
  const [selectedPostOffice, setSelectedPostOffice] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [offices, setOffices] = useState([]);
  const [userId, setUserId] = useState(null);

  // Initialize the navigation object
  const navigation = useNavigation();

  useEffect(() => {
    // Retrieve user information from AsyncStorage
    const getUserInfo = async () => {
      try {
        const id = await AsyncStorage.getItem("userId");
        setUserId(id);
      } catch (error) {
        console.error("Error retrieving user information:", error);
      }
    };

    getUserInfo();
  }, []);

  useEffect(() => {
    if (userId) {
      // Fetch the list of offices using userId
      const fetchOffices = async () => {
        try {
          const response = await fetch(
            `https://ff4b-71-85-245-93.ngrok-free.app/api/offices?user_id=${userId}`
          );
          if (response.ok) {
            const data = await response.json();
            setOffices(data); // Update the state with the fetched offices
          } else {
            console.error("Failed to fetch offices");
          }
        } catch (error) {
          console.error("Error fetching offices:", error);
        }
      };

      fetchOffices();
    }
  }, [userId]);

  const handlePostOfficeSelection = async (postOffice) => {
    try {
      setSelectedPostOffice(postOffice);

      // Save the selected office to AsyncStorage
      await AsyncStorage.setItem(
        "selectedOffice",
        postOffice.office_id.toString()
      );

      // Fetch the routes for the selected office
      const response = await fetch(
        `https://ff4b-71-85-245-93.ngrok-free.app/api/routesByOfficeId?office_id=${postOffice.office_id}`
      );

      if (response.ok) {
        const data = await response.json();
        // Update the selectedPostOffice with routes
        setSelectedPostOffice({ ...postOffice, routes: data });

        // Log the selected office ID from AsyncStorage
        const selectedOfficeId = await AsyncStorage.getItem("selectedOffice");
        console.log("Selected office ID: ", selectedOfficeId);
      } else {
        console.error("Failed to fetch routes");
      }
    } catch (error) {
      console.error("Error handling post office selection:", error);
    }
  };

  const handleRouteSelection = async (route) => {
    setSelectedRoute(route);
    await AsyncStorage.setItem("selectedRoute", route.route_id.toString()); // Save route_id as a string
    const theSelectedRoute = await AsyncStorage.getItem("selectedRoute");
    console.log("Selected route: ", theSelectedRoute);
  };

  // Use useEffect to navigate when both office and route are selected
  useEffect(() => {
    if (selectedPostOffice && selectedRoute) {
      navigation.navigate("Case Builder");
    }
  }, [selectedPostOffice, selectedRoute]);

  return (
    <View style={{ flex: 1, flexDirection: "row", padding: 16 }}>
      <View style={{ flex: 1 }}>
        <Text>Select a Post Office:</Text>
        <FlatList
          data={offices}
          keyExtractor={(item) => item.office_id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handlePostOfficeSelection(item)}
              style={{
                padding: 8,
                marginBottom: 4,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: "gray",
                backgroundColor:
                  selectedPostOffice &&
                  selectedPostOffice.office_id === item.office_id
                    ? "lightblue"
                    : "white",
              }}
            >
              <Text>{`${item.city}, ${item.state}`}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
      <View style={{ flex: 1 }}>
        {selectedPostOffice && (
          <View>
            <Text>Routes for {selectedPostOffice.name}:</Text>
            <FlatList
              data={selectedPostOffice ? selectedPostOffice.routes : []}
              keyExtractor={(item) => item.route_id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleRouteSelection(item)}
                  style={{
                    padding: 8,
                    marginBottom: 4,
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: "gray",
                    backgroundColor:
                      selectedRoute && selectedRoute.route_id === item.route_id
                        ? "lightblue"
                        : "white",
                  }}
                >
                  <Text>{`Route ${item.route_number}`}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>
    </View>
  );
}
