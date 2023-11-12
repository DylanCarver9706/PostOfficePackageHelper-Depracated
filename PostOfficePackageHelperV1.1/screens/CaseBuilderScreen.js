import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function CaseBuilderScreen({ route }) {
  const [selectedPostOffice, setSelectedPostOffice] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [cases, setCases] = useState([]);
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const navigation = useNavigation();

  // Define a function to fetch cases
  const fetchCases = async () => {
    try {
      const selectedRouteId = await AsyncStorage.getItem("selectedRoute");
      setSelectedRoute(selectedRouteId);
      const response = await fetch(
        `https://5165-71-85-245-93.ngrok-free.app/api/addressesByRouteId?route_id=${selectedRouteId}`
      );

      if (response.ok) {
        const data = await response.json();
        const casesData = {};

        data.forEach((address) => {
          const { case_number, case_row_number } = address;
          if (!(case_number in casesData)) {
            casesData[case_number] = [];
          }
          casesData[case_number].push(parseInt(case_row_number));
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
      const response = await fetch(
        "https://5165-71-85-245-93.ngrok-free.app/api/addresses",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newCaseData),
        }
      );

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

  return (
    <View style={styles.container}>
      <Text>Post Office: {selectedPostOffice}</Text>
      <Text>Route: {selectedRoute}</Text>
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
                handleRowPress(cases[currentCaseIndex]?.caseNumber, rowNumber)
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
});
