import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "../apiConfig";

export function SelectOfficeRouteScreen() {
  const [selectedPostOffice, setSelectedPostOffice] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [offices, setOffices] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [userId, setUserId] = useState(null);
  const [officeModalVisible, setOfficeModalVisible] = useState(false);
  const [routeModalVisible, setRouteModalVisible] = useState(false);
  const [newOfficeInfo, setNewOfficeInfo] = useState({
    city: "",
    state: "",
    supervisor_name: "",
    supervisor_phone_number: "",
    postmaster_name: "",
    postmaster_phone_number: "",
  });
  const [editingOffice, setEditingOffice] = useState(null);
  const [newRouteInfo, setNewRouteInfo] = useState({
    route_number: "",
    // Add other route fields here
  });
  const [editingRoute, setEditingRoute] = useState(null);

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

  // Function to fetch the list of offices
  const fetchOffices = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/officesByUserId?user_id=${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        filteredOffices = data.filter((office) => office.active_status != 0);
        setOffices(filteredOffices); // Update the state with the fetched offices
      } else {
        console.error("Failed to fetch offices");
      }
    } catch (error) {
      console.error("Error fetching offices:", error);
    }
  };

  useEffect(() => {
    if (userId) {
      // Fetch the list of offices using userId
      fetchOffices();
    }
  }, [userId]);

  const handlePostOfficeSelection = async (postOffice) => {
    try {
      setSelectedRoute(null);
      setSelectedPostOffice(postOffice);
      await AsyncStorage.setItem("selectedOffice", postOffice.office_id.toString());
      
      // Call fetchRoutes with the selected office's ID to update the routes state
      fetchRoutes(postOffice.office_id);
    } catch (error) {
      console.error("Error handling post office selection:", error);
    }
  };

  const handleRouteSelection = async (route) => {
    setSelectedRoute(route);
    await AsyncStorage.setItem("selectedRoute", route.route_id.toString()); // Save route_id as a string
    const theSelectedRoute = await AsyncStorage.getItem("selectedRoute");
    // setSelectedRoute(null)
    console.log("Selected route: ", theSelectedRoute);
  };

  const handleNextScreen = async () => {
    homeScreenSelection = await AsyncStorage.getItem("selectedScreen");
    console.log("The next Screen: ", homeScreenSelection);
    navigation.navigate(homeScreenSelection);
  };

  // Use useEffect to navigate when both office and route are selected
  useEffect(() => {
    if (selectedPostOffice && selectedRoute) {
      handleNextScreen();
    }
  }, [selectedPostOffice, selectedRoute]);

  // Function to handle opening the office modal
  const handleOpenOfficeModal = () => {
    setOfficeModalVisible(true);
  };

  // Function to handle opening the route modal
  const handleOpenRouteModal = () => {
    setRouteModalVisible(true);
  };

  // Function to handle the submission of the new office form
  const handleAddNewOffice = async () => {
    try {
      // Get user ID from AsyncStorage
      const userId = await AsyncStorage.getItem("userId");

      // Create a new office object
      const newOffice = {
        user_id: userId,
        city: newOfficeInfo.city,
        state: newOfficeInfo.state,
        supervisor_name: newOfficeInfo.supervisor_name,
        supervisor_phone_number: newOfficeInfo.supervisor_phone_number,
        postmaster_name: newOfficeInfo.postmaster_name,
        postmaster_phone_number: newOfficeInfo.postmaster_phone_number,
      };

      // Send a POST request to create a new office
      const response = await fetch(`${API_BASE_URL}/offices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newOffice),
      });

      if (response.ok) {
        // Refresh the list of offices
        fetchOffices();
        // Close the modal
        setOfficeModalVisible(false);
        // Clear the new office info
        setNewOfficeInfo({
          city: "",
          state: "",
          supervisor_name: "",
          supervisor_phone_number: "",
          postmaster_name: "",
          postmaster_phone_number: "",
        });
      } else {
        console.error("Failed to add new office");
      }
    } catch (error) {
      console.error("Error adding new office:", error);
    }
  };

  // Function to handle deleting an office
  const handleDeleteOffice = async (officeId) => {
    try {
      // Show a confirmation alert before deleting
      Alert.alert(
        "Confirm Deletion",
        "Are you sure you want to delete this office?\n\nThis will also delete all routes and addresses associated to it!",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            onPress: async () => {
              // Send a DELETE request to delete the office
              const response = await fetch(
                `${API_BASE_URL}/offices/delete/${officeId}`,
                {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ active_status: 0 }),
                }
              );

              // console.log(response.status);

              if (response.ok) {
                // Refresh the list of offices after a successful delete
                setSelectedRoute(null);
                setSelectedPostOffice(null);
                fetchOffices();
              } else {
                console.error("Failed to delete office");
              }
            },
            style: "destructive", // Use destructive style for the delete button
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error("Error deleting office:", error);
    }
  };

  // Function to handle opening the edit modal
  const handleEditOffice = (office) => {
    setEditingOffice(office); // Set the office being edited
    setNewOfficeInfo({
      city: office.city,
      state: office.state,
      supervisor_name: office.supervisor_name,
      supervisor_phone_number: office.supervisor_phone_number,
      postmaster_name: office.postmaster_name,
      postmaster_phone_number: office.postmaster_phone_number,
    }); // Populate the input fields with existing office data
    setOfficeModalVisible(true); // Open the modal
  };

  // Function to update an existing office
  const handleUpdateOffice = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/offices/${editingOffice.office_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            city: newOfficeInfo.city,
            state: newOfficeInfo.state,
            supervisor_name: newOfficeInfo.supervisor_name,
            supervisor_phone_number: newOfficeInfo.supervisor_phone_number,
            postmaster_name: newOfficeInfo.postmaster_name,
            postmaster_phone_number: newOfficeInfo.postmaster_phone_number,
          }),
        }
      );

      if (response.ok) {
        // Refresh the list of offices
        fetchOffices();
        // Close the modal
        setOfficeModalVisible(false);
        // Clear the new office info
        setNewOfficeInfo({
          city: "",
          state: "",
          supervisor_name: "",
          supervisor_phone_number: "",
          postmaster_name: "",
          postmaster_phone_number: "",
        });
        setEditingOffice(null);
      } else {
        console.error("Failed to update office");
      }
    } catch (error) {
      console.error("Error updating office:", error);
    }
  };

  // Function to handle adding a new route
  const handleAddNewRoute = async () => {
    try {
      const officeId = selectedPostOffice.office_id;
      const newRoute = {
        office_id: officeId,
        route_number: newRouteInfo.route_number,
        // Add other route fields here
      };
  
      const response = await fetch(`${API_BASE_URL}/routes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newRoute),
      });
  
      if (response.ok) {
        // Call fetchRoutes with the selected office's ID to update the routes state
        fetchRoutes(officeId);
  
        // Close the modal and clear the new route info
        setRouteModalVisible(false);
        setNewRouteInfo({
          route_number: "",
          // Clear other route fields here
        });
      } else {
        console.error("Failed to add new route");
      }
    } catch (error) {
      console.error("Error adding new route:", error);
    }
  };

  // Function to handle deleting a route
  const handleDeleteRoute = async (routeId) => {
    try {
      // Show a confirmation alert before deleting
      Alert.alert(
        "Confirm Deletion",
        "Are you sure you want to delete this route?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            onPress: async () => {
              // Send a DELETE request to delete the route
              const response = await fetch(
                `${API_BASE_URL}/routes/delete/${routeId}`,
                {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ active_status: 0 }),
                }
              );

              if (response.ok) {
                // Refresh the list of routes for the selected office
                const routesResponse = await fetch(
                  `${API_BASE_URL}/routesByOfficeId?office_id=${selectedPostOffice.office_id}`
                );

                if (routesResponse.ok) {
                  const data = await routesResponse.json();
                  const filteredRoutes = data.filter((route) => route.active_status !== 0);
                  setRoutes(filteredRoutes)
                } else {
                  console.error("Failed to fetch routes");
                }

                // Close the modal
                setRouteModalVisible(false);

                // Clear the new route info
                setNewRouteInfo({
                  route_number: "",
                  // Clear other route fields here
                });
              } else {
                // Handle errors or failed delete requests
                console.error("Failed to delete route");
              }
            },
            style: "destructive", // Use destructive style for the delete button
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error("Error deleting route:", error);
    }
  };

  const handleEditRoute = (route) => {
    setEditingRoute(route); // Set the route being edited
    setNewRouteInfo({
      route_number: route.route_number,
      // Populate other route fields here for editing
    });
    setRouteModalVisible(true); // Open the modal
  };

  const handleUpdateRoute = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/routes/${editingRoute.route_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            office_id: selectedPostOffice.office_id,
            route_number: newRouteInfo.route_number,
            // Include other updated route fields here
          }),
        }
      );
  
      if (response.ok) {
        // Call fetchRoutes with the selected office's ID to update the routes state
        fetchRoutes(selectedPostOffice.office_id);
  
        // Close the modal, clear the new route info, and reset the editing route
        setRouteModalVisible(false);
        setNewRouteInfo({
          route_number: "",
          // Clear other route fields here
        });
        setEditingRoute(null);
      } else {
        console.error("Failed to update route");
      }
    } catch (error) {
      console.error("Error updating route:", error);
    }
  };

  const fetchRoutes = async (officeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/routesByOfficeId?office_id=${officeId}`);
      
      if (response.ok) {
        const data = await response.json();
        const filteredRoutes = data.filter((route) => route.active_status !== 0);
        setRoutes(filteredRoutes); // Update the state with the fetched routes
      } else {
        console.error("Failed to fetch routes");
      }
    } catch (error) {
      console.error("Error fetching routes:", error);
    }
  };

  return (
    <View style={{ flex: 1, flexDirection: "row", padding: 16 }}>
      <View style={{ flex: 1 }}>
        {userId && (
          <View>
            <Text>Select a Post Office:</Text>
            <FlatList
              data={offices}
              keyExtractor={(item) => item.office_id.toString()}
              renderItem={({ item }) => (
                <View>
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

                  {/* Delete and Edit buttons for each office */}
                  <View style={{ flexDirection: "row" }}>
                    <TouchableOpacity
                      onPress={() => handleDeleteOffice(item.office_id)}
                      style={{
                        flex: 1,
                        padding: 8,
                        marginBottom: 4,
                        borderRadius: 4,
                        borderWidth: 1,
                        borderColor: "red",
                        backgroundColor: "white",
                        marginRight: 4,
                      }}
                    >
                      <Text style={{ color: "red" }}>Delete</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleEditOffice(item)}
                      style={{
                        flex: 1,
                        padding: 8,
                        marginBottom: 4,
                        borderRadius: 4,
                        borderWidth: 1,
                        borderColor: "blue",
                        backgroundColor: "white",
                      }}
                    >
                      <Text style={{ color: "blue" }}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
            {/* Button to open the modal */}
            <TouchableOpacity onPress={handleOpenOfficeModal}>
              <Text style={{ color: "blue", marginTop: 10 }}>
                Add New Office
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={{ flex: 1 }}>
        {selectedPostOffice && (
          <View>
            <Text>Select Route:</Text>
            <FlatList
              data={selectedPostOffice ? routes : []}
              keyExtractor={(item) => item.route_id.toString()}
              renderItem={({ item }) => (
                <View>
                  <TouchableOpacity
                    onPress={() => handleRouteSelection(item)}
                    style={{
                      padding: 8,
                      marginBottom: 4,
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: "gray",
                      backgroundColor:
                        selectedRoute &&
                        selectedRoute.route_id === item.route_id
                          ? "lightblue"
                          : "white",
                    }}
                  >
                    <Text>{`Route ${item.route_number}`}</Text>
                  </TouchableOpacity>

                  {/* Delete and Edit buttons for each office */}
                  <View style={{ flexDirection: "row" }}>
                    <TouchableOpacity
                      onPress={() => handleDeleteRoute(item.route_id)}
                      style={{
                        flex: 1,
                        padding: 8,
                        marginBottom: 4,
                        borderRadius: 4,
                        borderWidth: 1,
                        borderColor: "red",
                        backgroundColor: "white",
                        marginRight: 4,
                      }}
                    >
                      <Text style={{ color: "red" }}>Delete</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleEditRoute(item)}
                      style={{
                        flex: 1,
                        padding: 8,
                        marginBottom: 4,
                        borderRadius: 4,
                        borderWidth: 1,
                        borderColor: "blue",
                        backgroundColor: "white",
                      }}
                    >
                      <Text style={{ color: "blue" }}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />

            {/* Button to add a new route */}
            <TouchableOpacity onPress={handleOpenRouteModal}>
              <Text style={{ color: "blue", marginTop: 10 }}>
                Add New Route
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Modal for adding a new office or editing an existing office */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={officeModalVisible}
        onRequestClose={() => {
          setOfficeModalVisible(false);
        }}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <View style={{ backgroundColor: "white", padding: 20 }}>
            <Text>{editingOffice ? "Edit Office" : "Add New Office"}</Text>
            <TextInput
              placeholder="City"
              value={editingOffice ? newOfficeInfo.city : newOfficeInfo.city}
              onChangeText={(text) =>
                setNewOfficeInfo({ ...newOfficeInfo, city: text })
              }
            />
            <TextInput
              placeholder="State"
              value={editingOffice ? newOfficeInfo.state : newOfficeInfo.state}
              onChangeText={(text) =>
                setNewOfficeInfo({ ...newOfficeInfo, state: text })
              }
            />
            <TextInput
              placeholder="Supervisor Name"
              value={
                editingOffice
                  ? newOfficeInfo.supervisor_name
                  : newOfficeInfo.supervisor_name
              }
              onChangeText={(text) =>
                setNewOfficeInfo({ ...newOfficeInfo, supervisor_name: text })
              }
            />
            <TextInput
              placeholder="Supervisor Phone Number"
              value={
                editingOffice
                  ? newOfficeInfo.supervisor_phone_number
                  : newOfficeInfo.supervisor_phone_number
              }
              onChangeText={(text) =>
                setNewOfficeInfo({
                  ...newOfficeInfo,
                  supervisor_phone_number: text,
                })
              }
            />
            <TextInput
              placeholder="Postmaster Name"
              value={
                editingOffice
                  ? newOfficeInfo.postmaster_name
                  : newOfficeInfo.postmaster_name
              }
              onChangeText={(text) =>
                setNewOfficeInfo({ ...newOfficeInfo, postmaster_name: text })
              }
            />
            <TextInput
              placeholder="Postmaster Phone Number"
              value={
                editingOffice
                  ? newOfficeInfo.postmaster_phone_number
                  : newOfficeInfo.postmaster_phone_number
              }
              onChangeText={(text) =>
                setNewOfficeInfo({
                  ...newOfficeInfo,
                  postmaster_phone_number: text,
                })
              }
            />
            <Button
              title="Cancel"
              onPress={() => setOfficeModalVisible(false)}
            />
            <Button
              title="Save"
              onPress={editingOffice ? handleUpdateOffice : handleAddNewOffice}
            />
          </View>
        </View>
      </Modal>

      {/* Modal for adding a new route or editing an existing route */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={routeModalVisible}
        onRequestClose={() => {
          setRouteModalVisible(false);
        }}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <View style={{ backgroundColor: "white", padding: 20 }}>
            <Text>{editingRoute ? "Edit Route" : "Add New Route"}</Text>
            <TextInput
              placeholder="Route Number"
              value={newRouteInfo.route_number}
              onChangeText={(text) =>
                setNewRouteInfo({ ...newRouteInfo, route_number: text })
              }
            />
            {/* Add other input fields for route information here */}
            <Button
              title="Cancel"
              onPress={() => setRouteModalVisible(false)}
            />
            <Button
              title="Save"
              onPress={editingRoute ? handleUpdateRoute : handleAddNewRoute}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
