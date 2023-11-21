import React, { useEffect, useState } from "react";
import { View, Text, FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "../apiConfig";

export function AddressesScreen() {
  const [addresses, setAddresses] = useState([]);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const selectedCase = await AsyncStorage.getItem("selectedCase");
        const selectedRow = await AsyncStorage.getItem("selectedRow");

        if (selectedCase && selectedRow) {
          const response = await fetch(
            `${API_BASE_URL}/addressesByCaseAndRow?case_number=${selectedCase}&case_row_number=${selectedRow}`
          );

          if (response.ok) {
            const data = await response.json();
            setAddresses(data);
          } else {
            console.error("Failed to fetch addresses");
          }
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
      }
    };

    fetchAddresses();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      {addresses.length > 0 ? (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.address_id.toString()} // Use address_id as the key
          renderItem={({ item }) => (
            <View style={{ padding: 10 }}>
              <Text>{formatAddress(item)}</Text>
            </View>
          )}
        />
      ) : (
        <Text>No addresses found</Text>
      )}
    </View>
  );
}

// Function to format the address
function formatAddress(addressData) {
  const { address1, address2, city, state, zip_code } = addressData;

  // Create a formatted address string
  const formattedAddress = `${address1}${
    address2 ? `, ${address2}` : ""
  }, ${city}, ${state}, ${zip_code}`;
  return formattedAddress;
}
