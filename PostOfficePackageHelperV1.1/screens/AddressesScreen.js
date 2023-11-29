import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Button,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "../apiConfig";

export function AddressesScreen() {
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null)
  const [selectedRow, setSelectedRow] = useState(null)
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editedAddress, setEditedAddress] = useState({
    route_id: selectedRoute,
    case_number: selectedCase,
    case_row_number: selectedRow,
    address_number: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip_code: "",
  });
  const [newAddressModalVisible, setNewAddressModalVisible] = useState(false);
  const [newAddress, setNewAddress] = useState({
    route_id: selectedRoute,
    case_number: selectedCase,
    case_row_number: selectedRow,
    address_number: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip_code: "",
  });

  const fetchPreviousSelections = async () => {
    try {
      const previouslySelectedRoute = await AsyncStorage.getItem("selectedRoute");
      // console.log("Prev Selected Route: " + previouslySelectedRoute)
      setSelectedRoute(previouslySelectedRoute)

      const previouslySelectedCase = await AsyncStorage.getItem("selectedCase");
      // console.log("Prev Selected Case: " + previouslySelectedCase)
      setSelectedCase(previouslySelectedCase)

      const previouslySelectedRow = await AsyncStorage.getItem("selectedRow");
      // console.log("Prev Selected Row: " + previouslySelectedRow)
      setSelectedRow(previouslySelectedRow)

      fetchAddresses();

    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

  const fetchAddresses = async () => {
    try {
      // console.log(selectedCase, selectedRow)
      if (selectedCase && selectedRow) {
        requestUrl = `${API_BASE_URL}/addressesByRouteAndCaseAndRow?route_id=${selectedRoute}&case_number=${selectedCase}&case_row_number=${selectedRow}`
        // console.log(requestUrl)
        const response = await fetch(requestUrl);

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

  useEffect(() => {
    fetchPreviousSelections();
  }, []);


  useEffect(() => {
    fetchAddresses();
  }, [selectedRoute, selectedCase, selectedRow]);


  const handleDeleteAddress = async (addressId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove the deleted address from the addresses state
        setAddresses((prevAddresses) =>
          prevAddresses.filter((address) => address.address_id !== addressId)
        );
      } else {
        console.error("Failed to delete address");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
    }
  };

  const handleEditAddress = (address) => {
    setSelectedAddress(address);
    setEditedAddress({
      route_id: address.route_id,
      case_number: address.case_number,
      case_row_number: address.case_row_number,
      address_number: address.address_number,
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      state: address.state,
      zip_code: address.zip_code,
    });
    setModalVisible(true);
  };

  const handleSaveChanges = async () => {
    // Send a PUT request to update the address on the server
    try {
      const response = await fetch(
        `${API_BASE_URL}/addresses/${selectedAddress.address_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editedAddress),
        }
      );

      if (response.ok) {
        // Update the address in the addresses state
        setAddresses((prevAddresses) =>
          prevAddresses.map((address) =>
            address.address_id === selectedAddress.address_id
              ? { ...address, ...editedAddress }
              : address
          )
        );
        setModalVisible(false);
      } else {
        console.error("Failed to update address");
      }
    } catch (error) {
      console.error("Error updating address:", error);
    }
  };

  const handleAddAddress = async () => {
    setNewAddressModalVisible(true);
  };

  useEffect(() => {
    setNewAddress({
      route_id: selectedRoute,
      case_number: selectedCase,
      case_row_number: selectedRow,
      address_number: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      zip_code: "",
    });
  }, [selectedRoute, selectedCase, selectedRow]);

  const handleSaveNewAddress = async () => {
    // Send a POST request to create a new address
    try {
      const response = await fetch(`${API_BASE_URL}/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAddress),
      });

      if (response.ok) {
        // Refresh the addresses list
        fetchAddresses();
        setNewAddressModalVisible(false);
        setNewAddress({
          route_id: selectedRoute,
          case_number: selectedCase,
          case_row_number: selectedRow,
          address_number: "",
          address1: "",
          address2: "",
          city: "",
          state: "",
          zip_code: "",
        });
      } else {
        console.error("Failed to add new address");
      }
    } catch (error) {
      console.error("Error adding new address:", error);
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
              <TouchableOpacity onPress={() => handleEditAddress(item)}>
                <Text style={{ color: "blue", marginTop: 5 }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    "Confirm Delete",
                    "Are you sure you want to delete this address?\n\nAny deliveries associated with this address will also be deleted!\n",
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

      {/* Floating Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleAddAddress}
      >
        <Text style={styles.buttonText}>+</Text>
      </TouchableOpacity>

      {/* Edit Address Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <View style={{ backgroundColor: "white", padding: 20 }}>
            <TextInput
              placeholder="Address Number"
              value={editedAddress.address_number}
              onChangeText={(text) =>
                setEditedAddress({ ...editedAddress, address_number: text })
              }
            />
            <TextInput
              placeholder="Address 1"
              value={editedAddress.address1}
              onChangeText={(text) =>
                setEditedAddress({ ...editedAddress, address1: text })
              }
            />
            <TextInput
              placeholder="Address 2"
              value={editedAddress.address2}
              onChangeText={(text) =>
                setEditedAddress({ ...editedAddress, address2: text })
              }
            />
            <TextInput
              placeholder="City"
              value={editedAddress.city}
              onChangeText={(text) =>
                setEditedAddress({ ...editedAddress, city: text })
              }
            />
            <TextInput
              placeholder="State"
              value={editedAddress.state}
              onChangeText={(text) =>
                setEditedAddress({ ...editedAddress, state: text })
              }
            />
            <TextInput
              placeholder="Zip Code"
              value={editedAddress.zip_code}
              onChangeText={(text) =>
                setEditedAddress({ ...editedAddress, zip_code: text })
              }
            />
            <Button title="Cancel" onPress={() => setModalVisible(false)} />
            <Button title="Save Changes" onPress={handleSaveChanges} />
          </View>
        </View>
      </Modal>

      {/* Add Address Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={newAddressModalVisible}
        onRequestClose={() => {
          setNewAddressModalVisible(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              placeholder="Address Number"
              onChangeText={(text) =>
                setNewAddress({ ...newAddress, address_number: text })
              }
            />
            <TextInput
              placeholder="Address 1"
              onChangeText={(text) =>
                setNewAddress({ ...newAddress, address1: text })
              }
            />
            <TextInput
              placeholder="Address 2"
              onChangeText={(text) =>
                setNewAddress({ ...newAddress, address2: text })
              }
            />
            <TextInput
              placeholder="City"
              onChangeText={(text) =>
                setNewAddress({ ...newAddress, city: text })
              }
            />
            <TextInput
              placeholder="State"
              onChangeText={(text) =>
                setNewAddress({ ...newAddress, state: text })
              }
            />
            <TextInput
              placeholder="Zip Code"
              onChangeText={(text) =>
                setNewAddress({ ...newAddress, zip_code: text })
              }
            />
            <Button
              title="Cancel"
              onPress={() => setNewAddressModalVisible(false)}
            />
            <Button title="Save" onPress={handleSaveNewAddress} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function formatAddress(addressData) {
  const { address_number, address1, address2, city, state, zip_code } =
    addressData;
  const formattedAddress = `${address_number} ${address1}${
    address2 ? `, ${address2}` : ""
  }, ${city}, ${state}, ${zip_code}`;
  return formattedAddress;
}

const styles = StyleSheet.create({
  // ... (other styles)
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "blue",
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 24,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
  },
});
