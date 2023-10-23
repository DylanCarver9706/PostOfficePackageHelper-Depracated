import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

export function SelectOfficeRouteScreen({ user }) {
  const [selectedPostOffice, setSelectedPostOffice] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [offices, setOffices] = useState([]);

  // Initialize the navigation object
  const navigation = useNavigation();

  const handlePostOfficeSelection = async (postOffice) => {
    setSelectedPostOffice(postOffice);

    try {
      const response = await fetch(
        `https://4beb-71-85-245-93.ngrok-free.app/api/routes?office_id=${postOffice.office_id}`
      );
      if (response.ok) {
        const data = await response.json();
        // Update the selectedPostOffice with routes
        setSelectedPostOffice({ ...postOffice, routes: data });
      } else {
        console.error("Failed to fetch routes");
      }
    } catch (error) {
      console.error("Error fetching routes:", error);
    }
  };

  const handleRouteSelection = (route) => {
    setSelectedRoute(route);
  };

  useEffect(() => {
    if (user) {
      // Fetch the list of offices using user.user_id
      const fetchOffices = async () => {
        try {
          const response = await fetch(
            `https://4beb-71-85-245-93.ngrok-free.app/api/offices?user_id=${user.user_id}`
          );
          if (response.ok) {
            const data = await response.json();
            setOffices(data); // Update the state with the fetched offices
          } else {
            console.error('Failed to fetch offices');
          }
        } catch (error) {
          console.error('Error fetching offices:', error);
        }
      };

      fetchOffices();
    }
  }, [user]);

  // Use useEffect to navigate when both office and route are selected
  useEffect(() => {
    if (selectedPostOffice && selectedRoute) {
      navigation.navigate("Case Builder", {
        postOffice: selectedPostOffice.name,
        route: selectedRoute.name,
        user: user,
      });
    }
  }, [selectedPostOffice, selectedRoute, navigation]);

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
