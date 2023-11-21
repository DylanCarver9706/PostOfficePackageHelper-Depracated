import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, Button } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "../apiConfig";

export function PackageHelperScreen() {
  const navigation = useNavigation();
  const [deliveries, setDeliveries] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);

  useEffect(() => {
    // Get the route_id from AsyncStorage (you need to implement this)
    const fetchData = async () => {
      try {
        const selectedRouteId = await AsyncStorage.getItem("selectedRoute");
        setSelectedRoute(selectedRouteId);

        // Get today's date in the "YYYY-MM-DD" format
        const currentDate = new Date().toISOString().split("T")[0];
        console.log(currentDate);

        // Make the API request to get deliveries for the current route and date
        const response = await fetch(
          `${API_BASE_URL}/deliveriesByRouteAndDate?route_id=${selectedRouteId}&deliveryDate=${currentDate}`
        );

        if (response.ok) {
          const data = await response.json();
          console.log(data);
          setDeliveries(data); // Set the deliveries data in state
        } else {
          console.error("Error fetching deliveries:", response.status);
        }
      } catch (error) {
        console.error("Error fetching deliveries:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Package Helper Screen</Text>
      <FlatList
        data={deliveries}
        keyExtractor={(item) => item.delivery_id.toString()}
        renderItem={({ item }) => (
          <View style={styles.deliveryItem}>
            <Text>Delivery ID: {item.delivery_id}</Text>
            <Text>Address ID: {item.address_id}</Text>
            <Text>Delivery Date: {item.delivery_date}</Text>
            <Text>Scanned: {item.scanned ? "Yes" : "No"}</Text>
            <Text>
              Out for Delivery: {item.out_for_delivery ? "Yes" : "No"}
            </Text>
            <Text>Delivered: {item.delivered ? "Yes" : "No"}</Text>
          </View>
        )}
      />
      <Button
        title="Scan Label"
        onPress={() => {
          navigation.navigate("Scan Label");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  deliveryItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
  },
});
