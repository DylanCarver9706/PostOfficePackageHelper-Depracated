import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Button,
  Modal,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "../apiConfig";

export function PackageHelperScreen() {
  const navigation = useNavigation();
  const [deliveries, setDeliveries] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isAddDeliveryModalVisible, setIsAddDeliveryModalVisible] =
    useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [routeAddresses, setRouteAddresses] = useState([]);
  const [filteredAddresses, setFilteredAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  // Get today's date in the "YYYY-MM-DD" format
  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  global_address_id = null;

  const openAddDeliveryModal = () => {
    fetchAddresses();
    setIsAddDeliveryModalVisible(true);
    setSearchQuery("");
    setFilteredAddresses([]);
    setSelectedAddress(null);
  };

  const closeAddDeliveryModal = () => {
    setIsAddDeliveryModalVisible(false);
  };

  const handleSelectAddress = (address_id) => {
    console.log(selectedAddress);
    // handleAddDelivery();
    // closeAddDeliveryModal();
  };

  const searchAddresses = (text) => {
    // Filter addresses based on the searchQuery
    const searchText = text.toLowerCase();
    const filtered = routeAddresses.filter((address) => {
      const addressString =
        `${address.address_number} ${address.address1} ${address.address2} ${address.city} ${address.state} ${address.zip_code}`.toLowerCase();
      return addressString.includes(searchText);
    });
    setFilteredAddresses(filtered);
  };

  const handleAddDelivery = async (address_id) => {
    try {
      // address_id = await selectedAddress;
      // Construct the new case data
      const newDeliveryData = {
        route_id: selectedRoute,
        address_id: address_id,
        delivery_date: currentDate,
        scanned: true,
        out_for_delivery: false,
        delivered: false,
      };
      // console.log(newCaseData)
      // Send a POST request to add a new delivery
      const response = await fetch(`${API_BASE_URL}/deliveries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newDeliveryData),
      });

      if (response.ok) {
        // After adding the delivery, fetch the updated list of delivery
        closeAddDeliveryModal();
        setSelectedAddress(address_id);
      } else {
        console.error(
          "Failed to add a new delivery. Response status:",
          response.status
        );
        const responseText = await response.text();
        console.error("Response data:", responseText);
      }
    } catch (error) {
      console.error("Error adding a new delivery:", error);
    }
  };

  useEffect(() => {
    // Get the route_id from AsyncStorage (you need to implement this)
    const fetchDeliveries = async () => {
      try {
        const selectedRouteId = await AsyncStorage.getItem("selectedRoute");
        setSelectedRoute(selectedRouteId);

        // Make the API request to get deliveries for the current route and date
        const response = await fetch(
          `${API_BASE_URL}/deliveriesByRouteAndDate?route_id=${selectedRouteId}&deliveryDate=${currentDate}`
        );

        if (response.ok) {
          const data = await response.json();
          // console.log(data);
          setDeliveries(data); // Set the deliveries data in state
        } else {
          console.error("Error fetching deliveries:", response.status);
        }
      } catch (error) {
        console.error("Error fetching deliveries:", error);
      }
    };
    fetchDeliveries();
  }, [selectedAddress]);

  const fetchAddresses = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/addressesByRouteId?route_id=${selectedRoute}`
      );
      if (response.ok) {
        const data = await response.json();
        setRouteAddresses(data);
        setFilteredAddresses(data); // Initialize filteredAddresses with all addresses
      } else {
        console.error("Error fetching addresses:", response.status);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

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
            <Text>Address Number: {item.address_number}</Text>
            <Text>Address 1: {item.address1}</Text>
            <Text>Address 2: {item.address2}</Text>
            <Text>City: {item.city}</Text>
            <Text>State: {item.state}</Text>
            <Text>Zip Code: {item.zip_code}</Text>
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
      <Button title="Add Delivery" onPress={openAddDeliveryModal} />

      {/* Add Delivery Modal */}
      <Modal
        visible={isAddDeliveryModalVisible}
        animationType="slide"
        onRequestClose={closeAddDeliveryModal}
      >
        <View>
          <TextInput
            placeholder="Search for an address"
            onChangeText={(text) => {
              setSearchQuery(text);
              searchAddresses(text); // Call searchAddresses with the updated text
            }}
            value={searchQuery}
          />
          <FlatList
            data={filteredAddresses}
            keyExtractor={(item) => item.address_id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleAddDelivery(item.address_id)}
                style={styles.addressItem}
              >
                <Text>{`${item.address_number} ${item.address1} ${item.address2} ${item.city}, ${item.state} ${item.zip_code}`}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
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
  addressItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
    backgroundColor: "#f0f0f0",
  },
});
