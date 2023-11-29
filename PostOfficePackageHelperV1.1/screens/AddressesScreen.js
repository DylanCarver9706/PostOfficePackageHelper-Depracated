import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "../apiConfig";

export function AddressesScreen() {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);

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

  const handleDeleteAddress = async (addressId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/addresses/${addressId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Remove the deleted address from the addresses state
        setAddresses((prevAddresses) =>
          prevAddresses.filter(
            (address) => address.address_id !== addressId
          )
        );
      } else {
        console.error("Failed to delete address");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
    }
  };

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      {addresses.length > 0 ? (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.address_id.toString()}
          renderItem={({ item }) => (
            <View style={{ padding: 10 }}>
              <Text>{formatAddress(item)}</Text>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    "Confirm Delete",
                    "Are you sure you want to delete this address?\n\nAny deliveries associated to this address will also be deleted!\n",
                    [
                      {
                        text: "Cancel",
                        style: "cancel",
                      },
                      {
                        text: "Delete",
                        onPress: () => handleDeleteAddress(item.address_id),
                      },
                    ]
                  );
                }}
              >
                <Text style={{ color: "red", marginTop: 5 }}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        <Text>No addresses found</Text>
      )}
    </View>
  );
}

function formatAddress(addressData) {
  const { address1, address2, city, state, zip_code } = addressData;
  const formattedAddress = `${address1}${
    address2 ? `, ${address2}` : ""
  }, ${city}, ${state}, ${zip_code}`;
  return formattedAddress;
}
