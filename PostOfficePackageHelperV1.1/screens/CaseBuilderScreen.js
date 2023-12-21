import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, TouchableWithoutFeedback } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DraggableFlatList from "react-native-draggable-flatlist";
import API_BASE_URL from "../apiConfig";

export function CaseBuilderScreen() {
  const [selectedPostOffice, setSelectedPostOffice] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [cases, setCases] = useState([]);
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const navigation = useNavigation();
  const [caseViewActive, setCaseViewActive] = useState(true);
  const [addresses, setAddresses] = useState([]);

  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [listAddresses, setListAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [nextPositionNumber, setNextPositionNumber] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editedAddress, setEditedAddress] = useState({
    route_id: selectedRoute,
    case_number: selectedCase,
    case_row_number: selectedRow,
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
    position_number: nextPositionNumber,
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip_code: "",
  });
  const [updatedAddressOrder, setUpdatedAddressOrder] = useState([]);

  // Define a function to fetch cases
  const fetchCases = async () => {
    try {
      const selectedRouteId = await AsyncStorage.getItem("selectedRoute");
      setSelectedRoute(selectedRouteId);

      const selectedOfficeId = await AsyncStorage.getItem("selectedOffice");
      setSelectedPostOffice(selectedOfficeId);

      const response = await fetch(
        `${API_BASE_URL}/addressesByRouteId?route_id=${selectedRouteId}`
      );

      if (response.ok) {
        const data = await response.json();
        const casesData = {};

        data.forEach((address) => {
          const { case_number, case_row_number } = address;
          if (!(case_number in casesData)) {
            casesData[case_number] = [];
          }
          casesData[case_number].push(case_row_number); // <-- Remove parseInt here
        });

        const casesArray = Object.entries(casesData).map(
          ([caseNumber, rows]) => ({
            id: parseInt(caseNumber),
            caseNumber,
            rows: [1, 2, 3, 4, 5], // Ensure each case has 5 rows
          })
        );

        setCases(casesArray);
      } else {
        console.error("Failed to fetch addresses");
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  useEffect(() => {
    // Fetch cases when the component mounts
    fetchCases();
  }, []);

  const handleAddNewCase = async () => {
    try {
      // Construct the new case data
      const newCaseData = {
        route_id: selectedRoute,
        case_number: `${(cases.length + 1).toString()}`, // Increment the case number
        case_row_number: "0",
        address_number: "Address 1",
        address1: "123 Main St",
        address2: "Apt 4B",
        city: "City 1",
        state: "State 1",
        zip_code: "12345",
      };
      // console.log(newCaseData)
      // Send a POST request to add the new case
      const response = await fetch(`${API_BASE_URL}/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCaseData),
      });

      if (response.ok) {
        // After adding the new case, fetch the updated list of cases
        fetchCases();
      } else {
        console.error(
          "Failed to add a new case. Response status:",
          response.status
        );
        const responseText = await response.text();
        console.error("Response data:", responseText);
      }
    } catch (error) {
      console.error("Error adding a new case:", error);
    }
  };

  const handlePrevCase = () => {
    if (currentCaseIndex > 0) {
      setCurrentCaseIndex(currentCaseIndex - 1);
    }
  };

  const handleNextCase = () => {
    if (currentCaseIndex < cases.length - 1) {
      setCurrentCaseIndex(currentCaseIndex + 1);
    }
  };

  const handleRowPress = (caseNumber, rowNumber) => {
    // Set selectedCase and selectedRow in AsyncStorage
    AsyncStorage.setItem("selectedCase", caseNumber.toString());
    AsyncStorage.setItem("selectedRow", rowNumber.toString());

    // Log the selectedCase and selectedRow
    console.log("Selected Case: ", caseNumber);
    console.log("Selected Row: ", rowNumber);

    // Navigate to AddressesScreen with the selected case number and row number
    navigation.navigate("Addresses", {
      caseNumber,
      rowNumber,
    });
  };

  const handleGoToCaseView = () => {
    setCaseViewActive(true);
  };

  const handleGoToListView = () => {
    setCaseViewActive(false);
  };

  const fetchAddresses = async () => {
    try {
      // Fetch addresses in delivery order
      const requestUrl = `${API_BASE_URL}/addresses?route_id=${selectedRoute}`;
      const response = await fetch(requestUrl);
  
      if (response.ok) {
        const data = await response.json();
  
        // Sort the addresses by case_number, case_row_number, and position_number
        const sortedDeliveries = data.sort((a, b) => {
          // First, sort by 'delivered' status (ascending order)
          if (a.delivered !== b.delivered) {
            return a.delivered ? 1 : -1;
          }
          // If 'delivered' status is the same, then sort by case_number, etc.
          if (a.case_number !== b.case_number) {
            return a.case_number - b.case_number;
          }
          if (a.case_row_number !== b.case_row_number) {
            return a.case_row_number - b.case_row_number;
          }
          return a.position_number - b.position_number;
        });
  
        setAddresses(sortedDeliveries);

        // 
        const sortedAddresses = [...data].sort(
          (a, b) => a.position_number - b.position_number
        );

        // Update the position_number for each address
        const updatedAddresses = sortedAddresses.map((address, index) => ({
          ...address,
          position_number: index + 1,
        }));

        // Set the next position_number
        // console.log(sortedAddresses.length + 1)
        setNextPositionNumber(updatedAddresses.length + 1);

        // Update the state with the corrected position numbers
        setListAddresses(sortedDeliveries);
      } else {
        console.error("Failed to fetch addresses");
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  function formatAddress(addressData) {
    const { address1, address2, city, state, zip_code } = addressData;
    const formattedAddress = `${address1}${
      address2 ? `, ${address2}` : ""
    }, ${city}, ${state}, ${zip_code}`;
    return formattedAddress;
  }

const fetchPreviousSelections = async () => {
  try {
    const previouslySelectedRoute = await AsyncStorage.getItem(
      "selectedRoute"
    );
    // console.log("Prev Selected Route: " + previouslySelectedRoute)
    setSelectedRoute(previouslySelectedRoute);

    const previouslySelectedCase = await AsyncStorage.getItem("selectedCase");
    // console.log("Prev Selected Case: " + previouslySelectedCase)
    setSelectedCase(previouslySelectedCase);

    const previouslySelectedRow = await AsyncStorage.getItem("selectedRow");
    // console.log("Prev Selected Row: " + previouslySelectedRow)
    setSelectedRow(previouslySelectedRow);

    fetchAddresses();
  } catch (error) {
    console.error("Error fetching route:", error);
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
      setListAddresses((prevAddresses) =>
        prevAddresses.filter((address) => address.address_id !== addressId)
      );
      fetchAddresses();
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
      setListAddresses((prevAddresses) =>
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
    position_number: nextPositionNumber,
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip_code: "",
  });
}, [selectedRoute, selectedCase, selectedRow, nextPositionNumber]);

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
        position_number: nextPositionNumber,
        address1: "",
        address2: "",
        city: "",
        state: "",
        zip_code: "",
      });
    } else {
      console.error("Failed to add a new address");
    }
  } catch (error) {
    console.error("Error adding a new address:", error);
  }
};

const onDragEnd = async ({ data }) => {
  // console.log("OngDragEnd Data: " + JSON.stringify(data, null, 2));
  try {
    const updatedAddresses = [];

    for (let i = 0; i < data.length; i++) {
      if (data[i].type === "address") {
        updatedAddresses.push(data[i].addressData);
      }
    }
    // console.log("##################################################")
  // console.log("OngDragEnd updatedAddresses Data: " + JSON.stringify(updatedAddresses, null, 2));

    // Update the addresses state with the new order
    setListAddresses(updatedAddresses);

    // Update the position_number for each address
    const updatedAddressesWithPosition = updatedAddresses.map((address, index) => ({
      ...address,
      position_number: index + 1,
    }));

    // Extract the address_ids
    const addressIds = updatedAddressesWithPosition.map((address) => address.address_id);
    // console.log("Address IDs:", addressIds);

    // Set the updated address order
    // setUpdatedAddressOrder(updatedAddressesWithPosition);

    // Update the address order on the server
    await updateAddressOrderOnServer(addressIds);
  } catch (error) {
    console.error("Error updating address order:", error);
  }
};

// Modify the updateAddressOrderOnServer function to include debugging statements
const updateAddressOrderOnServer = async (addressIds) => {
  try {
    // console.log("Updating address order for IDs:", addressIds);

    // Iterate through the addressIds array and send PUT requests
    for (let i = 0; i < addressIds.length; i++) {
      const addressId = addressIds[i];
      // console.log("Updating address order for ID:", addressId);

      const response = await fetch(
        `${API_BASE_URL}/addresses/${addressId}/reorder`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            position_number: i + 1,
          }),
        }
      );

      if (!response.ok) {
        console.error("Failed to update address order");
        // Handle errors here
      }
    }
    console.log("Address positions updated to server!");
  } catch (error) {
    console.error("Error updating address order:", error);
  }
};

function formatAddress(addressData) {
  const { address1, address2, city, state, zip_code } = addressData;
  const formattedAddress = `${address1}${
    address2 ? `, ${address2}` : ""
  }, ${city}, ${state}, ${zip_code}`;
  return formattedAddress;
}

useEffect(() => {
  if (updatedAddressOrder.length > 0) {
    // Update the position numbers on the server
    updateAddressOrderOnServer(updatedAddressOrder);
  }
}, [updatedAddressOrder]);

// Define a function to group addresses by case number
const groupAddressesByCase = () => {
  const groupedAddresses = [];
  let currentCaseNumber = null;
  let currentRowNumber = null;

  listAddresses.forEach((address) => {
    if (address.case_number !== currentCaseNumber) {
      currentCaseNumber = address.case_number;
      groupedAddresses.push({
        type: "caseStart",
        caseNumber: currentCaseNumber,
      });
    }

    if (address.case_row_number !== currentRowNumber) {
      currentRowNumber = address.case_row_number;
      groupedAddresses.push({
        type: "rowStart",
        rowNumber: currentRowNumber,
      });
    }

    // groupedAddresses.push({
    //   type: "rowStart",
    //   caseNumber: currentCaseNumber,
    //   caseRowNumber: address.case_row_number,
    // });

    groupedAddresses.push({
      type: "address",
      addressData: address,
    });
  });

  return groupedAddresses;
};

const groupedAddresses = groupAddressesByCase();

  return (
    <View style={styles.container}>
      <View>
        <TouchableOpacity onPress={handleGoToCaseView}>
          <Text>Case View</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleGoToListView}>
          <Text>List View</Text>
        </TouchableOpacity>
      </View>
      {caseViewActive === true && (
        <View>
          <Text>Post Office ID: {selectedPostOffice}</Text>
          <Text>Route ID: {selectedRoute}</Text>
          <Button title="Add New Case" onPress={handleAddNewCase} />
          <View style={styles.caseContainer}>
            <Text style={styles.caseTitle}>
              Case: {cases[currentCaseIndex]?.caseNumber}
            </Text>
            <TouchableOpacity style={styles.case}>
              {cases[currentCaseIndex]?.rows.map((rowNumber) => (
                <TouchableOpacity
                  key={rowNumber}
                  style={styles.row}
                  onPress={() =>
                    handleRowPress(
                      cases[currentCaseIndex]?.caseNumber,
                      rowNumber
                    )
                  }
                >
                  <Text>Row {rowNumber}</Text>
                </TouchableOpacity>
              ))}
            </TouchableOpacity>
            <View style={styles.navigationButtons}>
              <TouchableOpacity onPress={handlePrevCase}>
                <Text style={styles.navigationText}>Previous Case</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNextCase}>
                <Text style={styles.navigationText}>Next Case</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {caseViewActive === false && (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        {groupedAddresses.length > 0 ? (
          <DraggableFlatList
          data={groupedAddresses}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index, drag }) => {
            if (item.type === "caseStart") {
              return (
                <View style={styles.caseSeparator}>
                  <Text>Case {item.caseNumber} start</Text>
                </View>
              );
            } else if (item.type === "rowStart") {
              return (
                <View style={styles.caseRowSeparator}>
                  <Text>Row {item.rowNumber} start</Text>
                </View>
              );
            } else if (item.type === "address") {
              const address = item.addressData;
              return (
                <TouchableOpacity>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                      padding: 15,
                      backgroundColor: "white",
                      borderWidth: 1,
                      borderColor: "gray",
                      borderRadius: 25,
                    }}
                  >
                    <TouchableWithoutFeedback onPressIn={drag}>
                      <Text style={{ color: "blue", marginRight: 10 }}>☰</Text>
                    </TouchableWithoutFeedback>
                    <View>
                      <Text>{formatAddress(address)}</Text>
                      <Text>Position Number: {address.position_number}</Text>
                      <Text>Case Number: {address.case_number}</Text>
                      <Text>Row Number: {address.case_row_number}</Text>
                      <TouchableOpacity onPress={() => handleEditAddress(address)}>
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
                                onPress: () => handleDeleteAddress(address.address_id),
                              },
                            ]
                          );
                        }}
                      >
                        <Text style={{ color: "red", marginTop: 5 }}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }
          }}
          onDragEnd={({ data }) => onDragEnd({ data })}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  caseContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  caseTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  case: {
    width: 200,
    height: 200, // Adjust the height as needed
    backgroundColor: "lightgray",
    justifyContent: "space-between",
  },
  row: {
    flex: 1,
    backgroundColor: "lightblue",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "gray",
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
    marginTop: 10,
  },
  navigationText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "blue",
  },
  addressItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  caseSeparator: {
    padding: 8,
    backgroundColor: "#e1e1e1",
  },
  caseRowSeparator: {
    padding: 8,
    backgroundColor: "#d1d1d1",
  },
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
