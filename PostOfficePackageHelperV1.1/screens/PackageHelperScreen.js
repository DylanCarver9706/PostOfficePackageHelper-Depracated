import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  Dimensions,
  ActivityIndicator,
  TextInput,
  FlatList,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import ToastManager, { Toast } from "toastify-react-native";
// import DatePicker from "react-native-date-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import API_BASE_URL from "../apiConfig";

const { width, height } = Dimensions.get("window");

// Function to set the timezone to the user's timezone
function setTimeZoneToUserTimeZone(date) {
  const userTimeZoneOffsetMinutes = new Date().getTimezoneOffset();
  const offsetMilliseconds = userTimeZoneOffsetMinutes * 60 * 1000;
  const userTimeZoneDate = new Date(date.getTime() - offsetMilliseconds);
  return userTimeZoneDate;
}

export function PackageHelperScreen() {
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deliveries, setDeliveries] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isAddDeliveryModalVisible, setIsAddDeliveryModalVisible] =
    useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [routeAddresses, setRouteAddresses] = useState([]);
  const [filteredAddresses, setFilteredAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const cameraRef = useRef(null);

  const [isAddNewAddressModalVisible, setIsAddNewAddressModalVisible] =
    useState(false);
  const [newAddressData, setNewAddressData] = useState({
    route_id: null,
    case_number: null,
    case_row_number: null,
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip_code: "",
  });
  const [selectedAddressUpdated, setSelectedAddressUpdated] = useState(false);
  const [isPackageMarkerModalVisible, setIsPackageMarkerModalVisible] =
    useState(false);
  const [packageMarker, setPackageMarker] = useState("");

  let currentDate = setTimeZoneToUserTimeZone(new Date());

  const formatDate = (rawDate) => {
    let date = new Date(rawDate);

    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    let formattedMonth = month < 10 ? `0${month}` : `${month}`;
    let formattedDay = day < 10 ? `0${day}` : `${day}`;

    return `${year}-${formattedMonth}-${formattedDay}`;
  };

  const [date, setDate] = useState(formatDate(currentDate));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const askForCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");
  };

  const closeAddNewAddressModal = () => {
    setIsAddNewAddressModalVisible(false);
  };

  const openAddNewAddressModal = () => {
    setIsAddNewAddressModalVisible(true);
  };

  const openAddDeliveryModal = () => {
    fetchAddresses();
    setIsAddDeliveryModalVisible(true);
    setSearchQuery("");
    setFilteredAddresses([]);
  };

  const closeAddDeliveryModal = () => {
    setIsAddDeliveryModalVisible(false);
  };

  const searchAddresses = (text) => {
    const searchText = text.toLowerCase();
    const filtered = routeAddresses.filter((address) => {
      const addressString =
        `${address.address1} ${address.address2} ${address.city} ${address.state} ${address.zip_code}`.toLowerCase();
      return addressString.includes(searchText);
    });
    setFilteredAddresses(filtered);
  };

  function wait(timeout) {
    return new Promise((resolve) => {
      setTimeout(resolve, timeout);
    });
  }

  const handleAddDelivery = async () => {
    // let counter = 0
    // while (!selectedAddress && !packageMarker) {
    //   counter ++
    //   await wait(1000)
    //   console.log("Looped " + counter + " time(s)")
    // }
    await wait(1000);
    console.log(
      "address_id: " + selectedAddress + " package marker: " + packageMarker
    );
    try {
      const newDeliveryData = {
        route_id: selectedRoute,
        address_id: selectedAddress,
        delivery_date: date,
        package_marker_number: packageMarker,
        scanned: true,
        out_for_delivery: false,
        delivered: false,
      };
      console.log(newDeliveryData);
      const response = await fetch(`${API_BASE_URL}/deliveries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newDeliveryData),
      });

      if (response.ok) {
        closeAddDeliveryModal();
        closePackageMarkerModal();
        fetchDeliveries();
        Toast.success("Delivery Added");
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

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();

      // Save the captured image to the device's media library
      // MediaLibrary.createAssetAsync(photo.uri);

      const formData = new FormData();
      formData.append("imageUri", {
        uri: photo.uri,
        type: "image/jpeg",
        name: "image.jpg",
      });
      console.log("text extraction started...");
      setIsLoading(true);
      fetch(`${API_BASE_URL}/recognize-image-objects`, {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then(async (data) => {
          const fullExtractedText = data.text;
          console.log(fullExtractedText);

          if (fullExtractedText) {
            await AsyncStorage.setItem(
              "lastScannedData",
              JSON.stringify(fullExtractedText)
            );

            if (fullExtractedText.address2 !== "") {
              requestUrl = `${API_BASE_URL}/addressesByFormattedData?fullAddress=${fullExtractedText.address1} ${fullExtractedText.address2} ${fullExtractedText.city} ${fullExtractedText.state} ${fullExtractedText.zip_code}`;
            } else {
              requestUrl = `${API_BASE_URL}/addressesByFormattedData?fullAddress=${fullExtractedText.address1} ${fullExtractedText.city} ${fullExtractedText.state} ${fullExtractedText.zip_code}`;
            }
            // console.log(requestUrl);

            const response = await fetch(requestUrl);

            if (response.ok) {
              const addressData = await response.json();
              console.log("Address Found: \n", addressData);
              if (addressData.length > 0) {
                setSelectedAddress(addressData[0].address_id);
                setPackageMarker(addressData[0].package_marker_number);
                openPackageMarkerModal();
                setCameraVisible(false);
                setIsLoading(false);
              } else {
                console.log("Address not found. Creating new address...");
                setCameraVisible(false);
                setIsLoading(false);
                openAddNewAddressModal();
                setNewAddressData({
                  route_id: selectedRoute,
                  address1: fullExtractedText.address1,
                  address2: fullExtractedText.address2,
                  city: fullExtractedText.city,
                  state: fullExtractedText.state,
                  zip_code: fullExtractedText.zip_code,
                });
              }
            } else {
              console.error("Error fetching address:", response.status);
              setIsLoading(false);
            }
          } else {
            console.error("No valid extracted text found.");
            setIsLoading(false);
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  };

  const fetchDeliveries = async () => {
    try {
    setIsLoading(true)
      const selectedRouteId = await AsyncStorage.getItem("selectedRoute");
      setSelectedRoute(selectedRouteId);

      const response = await fetch(
        `${API_BASE_URL}/deliveriesByRouteAndDate?route_id=${selectedRouteId}&deliveryDate=${date}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log(data)
        // Filter by only active deliveries
        deliveryData = data.filter((delivery) => delivery.active_status != 0);
        // Sort deliveries based on 'delivered' status and then by case_number,
        // case_row_number, and position_number
        // Group deliveries by case_row_number
        const groupedDeliveries = {};
        deliveryData.forEach((delivery) => {
          const caseRowNumber = delivery.case_row_number;
          if (!groupedDeliveries[caseRowNumber]) {
            groupedDeliveries[caseRowNumber] = [];
          }
          groupedDeliveries[caseRowNumber].push(delivery);
        });

        // Sort deliveries within each group by case_number
        for (const key in groupedDeliveries) {
          groupedDeliveries[key].sort((a, b) => a.case_number - b.case_number);
        }

        // Flatten the groups back into a single array
        const sortedDeliveries = [];
        const maxGroups = Math.max(...Object.keys(groupedDeliveries));
        for (let i = 1; i <= maxGroups; i++) {
          if (groupedDeliveries[i]) {
            sortedDeliveries.push(...groupedDeliveries[i]);
          }
        }

        // console.log(sortedDeliveries);
        setDeliveries(sortedDeliveries);
        setIsLoading(false)
      } else {
        console.error("Error fetching deliveries:", response.status);
      }
    } catch (error) {
      console.error("Error fetching deliveries:", error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/addressesByRouteId?route_id=${selectedRoute}`
      );
      if (response.ok) {
        const data = await response.json();
        const filteredAddresses = data.filter(
          (address) =>
            address.address1 != "123 Main St" &&
            address.address2 != "Apt 4B" &&
            address.case_row_number != 0 &&
            address.city != "City 1" &&
            address.state != "State 1" &&
            address.zip_code != "12345"
        );
        setRouteAddresses(filteredAddresses);
        setFilteredAddresses(filteredAddresses);
      } else {
        console.error("Error fetching addresses:", response.status);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // Handle any logic you want when the screen is focused
      askForCameraPermission();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    fetchDeliveries();
  }, [selectedAddress, date]);

  const handleAddNewAddress = async () => {
    console.log(
      "handle add new address data: \n" +
        JSON.stringify(newAddressData, null, 2)
    );
    try {
      const response = await fetch(`${API_BASE_URL}/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAddressData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data);
        setSelectedAddress(data.address.id.toString());
        console.log(data.address.id);
        await wait(2000);
        console.log(selectedAddress);
        // Triggers addNewDelivery
        setSelectedAddressUpdated(true);
        closeAddNewAddressModal();
        closePackageMarkerModal();
        Toast.success("Address Added");
      } else {
        console.error(
          "Failed to add a new address. Response status:",
          response.status
        );
        const responseText = await response.text();
        console.error("Response data:", responseText);
      }
    } catch (error) {
      console.error("Error adding a new address:", error);
    }
  };

  useEffect(() => {
    if (selectedAddressUpdated) {
      handleAddDelivery();
    }
  }, [selectedAddressUpdated]);

  const openPackageMarkerModal = () => {
    setIsPackageMarkerModalVisible(true);
  };

  const closePackageMarkerModal = () => {
    setIsPackageMarkerModalVisible(false);
  };

  const onChange = ({ type }, selectedDate) => {
    if (type == "set") {
      // setShowDatePicker(Platform.OS === 'ios'); // Hide the picker on iOS
      setDate(formatDate(selectedDate));
      console.log(formatDate(selectedDate));

      if (Platform.OS === "android") {
        toggleDatepicker();
        setDate(formatDate(selectedDate));
      }
    } else {
      toggleDatepicker();
    }
  };

  const toggleDatepicker = () => {
    setShowDatePicker(!showDatePicker);
  };

  const confirmIOSDate = () => {
    setDate(formatDate(selectedDate));
    toggleDatepicker();
  };

  // Function to toggle the 'Delivered' status for a specific delivery
  const toggleDeliveredStatus = async (deliveryId, isDelivered) => {
    try {
      const response = await fetch(`${API_BASE_URL}/deliveries/${deliveryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ delivered: isDelivered }),
      });

      if (response.ok) {
        fetchDeliveries(); // Refresh the delivery list
        Toast.success(
          `Delivery marked as ${isDelivered ? "delivered" : "not delivered"}`
        );
      } else {
        console.error(
          "Failed to toggle 'Delivered' status. Response status:",
          response.status
        );
        const responseText = await response.text();
        console.error("Response data:", responseText);
      }
    } catch (error) {
      console.error("Error toggling 'Delivered' status:", error);
    }
  };

  const handleDeleteDelivery = async (deliveryId, activeStatus) => {
    // Display a confirmation alert to confirm the delete action
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this delivery?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Delete"),
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              // console.log(deliveryId)
              // console.log(activeStatus)
              // console.log(!activeStatus)
              const response = await fetch(
                `${API_BASE_URL}/deliveries/delete/${deliveryId}`,
                {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ active_status: 0 }),
                }
              );

              if (response.ok) {
                // Remove the deleted delivery from the local state (deliveries)
                setDeliveries((prevDeliveries) =>
                  prevDeliveries.filter(
                    (delivery) => delivery.delivery_id !== deliveryId
                  )
                );
                Toast.success("Delivery Deleted");
              } else {
                console.error(
                  "Failed to delete the delivery. Response status:",
                  response.status
                );
              }
            } catch (error) {
              console.error("Error deleting the delivery:", error);
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <ToastManager />
      <SafeAreaView>
        <Button onPress={toggleDatepicker} title="Select Date" />
        <Text>Deliveries for: {date}</Text>
        {/* DateTimePicker component */}
        {showDatePicker && (
          <DateTimePicker
            value={currentDate}
            mode="date"
            display="spinner"
            onChange={onChange}
          />
        )}
        {/* For IOS Date Picker  */}
        {/* {showDatePicker && (
        <Pressable onPress={toggleDatepicker()}>
          <TextInput
            style={styles.input}
            placeholder="Sat Aug 21 2004"
            value={date}
            onChangeText={(text) => setDate(text)}
            onPressIn={toggleDatepicker()}
          />
        </Pressable>
      )}

      {showDatePicker && Platform.OS === "ios" && (
        <View
          style={{ flexDirection: "row", justifyContent: "space-around" }}
        >
          <TouchableOpacity onPress={toggleDatepicker}>
            <Text>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={confirmIOSDate}>
            <Text>Confirm</Text>
          </TouchableOpacity>

        </View>
        )} */}
      </SafeAreaView>

      {hasPermission === false && (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>No access to camera</Text>
          <Button title={"Allow Camera"} onPress={askForCameraPermission} />
        </View>
      )}

      <Modal
        visible={cameraVisible}
        animationType="slide"
        onRequestClose={() => setCameraVisible(false)}
      >
        <View style={styles.cameraContainer}>
          {hasPermission === true ? (
            isLoading ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : (
              <View style={styles.cameraContainer}>
                <Camera
                  ref={cameraRef}
                  style={styles.cameraPreview}
                  type={Camera.Constants.Type.back}
                >
                  {/* Mask Overlay */}
                  <View style={styles.maskOverlay}>
                    <View style={styles.maskCenter}>
                      <View
                        style={[styles.maskFrame, styles.maskCenterFrame]}
                      />
                    </View>
                  </View>
                </Camera>
                <Button title="Take Picture" onPress={takePicture} />
              </View>
            )
          ) : null}
        </View>
      </Modal>

      <Modal
        visible={isAddNewAddressModalVisible}
        animationType="slide"
        onRequestClose={closeAddNewAddressModal}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Address Not Found.</Text>
          <Text style={styles.modalTitle}>Add New Address?</Text>
          <TextInput
            placeholder="Address 1"
            onChangeText={(text) =>
              setNewAddressData({ ...newAddressData, address1: text })
            }
            value={newAddressData.address1}
          />
          <TextInput
            placeholder="Address 2"
            onChangeText={(text) =>
              setNewAddressData({ ...newAddressData, address2: text })
            }
            value={newAddressData.address2}
          />
          <TextInput
            placeholder="City"
            onChangeText={(text) =>
              setNewAddressData({ ...newAddressData, city: text })
            }
            value={newAddressData.city}
          />
          <TextInput
            placeholder="State"
            onChangeText={(text) =>
              setNewAddressData({ ...newAddressData, state: text })
            }
            value={newAddressData.state}
          />
          <TextInput
            placeholder="ZIP Code"
            onChangeText={(text) =>
              setNewAddressData({ ...newAddressData, zip_code: text })
            }
            value={newAddressData.zip_code}
          />
          <TextInput
            placeholder="Case Number"
            onChangeText={(text) =>
              setNewAddressData({ ...newAddressData, case_number: text })
            }
          />
          <TextInput
            placeholder="Row Number"
            onChangeText={(text) =>
              setNewAddressData({ ...newAddressData, case_row_number: text })
            }
          />
          <TextInput
            placeholder="Package Marker Number"
            onChangeText={(text) => setPackageMarker(text)}
          />
          <Button title="Add Address" onPress={handleAddNewAddress} />
          <Button
            title="Retry?"
            onPress={() => {
              setCameraVisible(true);
              closeAddNewAddressModal();
              setNewAddressData({
                case_number: null,
                case_row_number: null,
                address1: "",
                address2: "",
                city: "",
                state: "",
                zip_code: "",
              });
            }}
          />
        </View>
      </Modal>
      {deliveries.length > 0 ? (
      <FlatList
        data={deliveries}
        keyExtractor={(item) => item.delivery_id.toString()}
        renderItem={({ item }) => (
          <View style={styles.deliveryItem}>
            <Text>Delivery ID: {item.delivery_id}</Text>
            <Text>Address ID: {item.address_id}</Text>
            <Text>Case Number: {item.case_number}</Text>
            <Text>Row Number: {item.case_row_number}</Text>
            <Text>Row Position Number: {item.position_number}</Text>
            <Text>Package Marker Number: {item.package_marker_number}</Text>
            <Text>Address 1: {item.address1}</Text>
            <Text>Address 2: {item.address2}</Text>
            <Text>City: {item.city}</Text>
            <Text>State: {item.state}</Text>
            <Text>Zip Code: {item.zip_code}</Text>
            <Text>Delivered: {item.delivered ? "Yes" : "No"}</Text>
            <Button
              title={item.delivered ? "Mark Undelivered" : "Mark Delivered"}
              onPress={() =>
                toggleDeliveredStatus(item.delivery_id, !item.delivered)
              }
            />
            {/* Delete button */}
            <Button
              title="Delete"
              onPress={() =>
                handleDeleteDelivery(item.delivery_id, item.active_status)
              }
              color="red"
            />
          </View>
        )}
      />
      ) : (
        <Text>No deliveries found.</Text>
      )}
      <Button title="Scan Label" onPress={() => setCameraVisible(true)} />
      <Button title="Add Delivery" onPress={openAddDeliveryModal} />

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
              searchAddresses(text);
            }}
            value={searchQuery}
          />
          <FlatList
            data={filteredAddresses}
            keyExtractor={(item) => item.address_id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setIsPackageMarkerModalVisible(true);
                  setSelectedAddress(item.address_id);
                }}
                style={styles.addressItem}
              >
                <Text>{`${item.address1} ${item.address2} ${item.city}, ${item.state} ${item.zip_code}`}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      <Modal
        visible={isPackageMarkerModalVisible}
        animationType="slide"
        onRequestClose={() => setIsPackageMarkerModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Enter Package Marker Number</Text>
          <TextInput
            placeholder="Package Marker"
            onChangeText={(text) => setPackageMarker(text)}
            value={packageMarker}
          />
          <Button title="Submit" onPress={handleAddDelivery} />
          <Button
            title="Cancel"
            onPress={() => setIsPackageMarkerModalVisible(false)}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  permissionContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  permissionText: {
    margin: 10,
  },
  cameraContainer: {
    flex: 1,
    width: "100%",
  },
  cameraPreview: {
    flex: 1,
  },
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
  maskOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  maskCenter: {
    flexDirection: "row",
  },
  maskCenterFrame: {
    width: width - 150,
    height: height / 1.55,
    borderColor: "red",
    borderWidth: 5,
  },
});
