import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";

export function CaseBuilderScreen({ route }) {
  // const { postOffice, route: selectedRoute } = route.params;
  const [selectedPostOffice, setSelectedPostOffice] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [cases, setCases] = useState([]);
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchAddressesByRouteId = async () => {
      try {
        const selectedOfficeId = await AsyncStorage.getItem("selectedOffice");
        setSelectedPostOffice(selectedOfficeId);

        const selectedRouteId = await AsyncStorage.getItem("selectedRoute");
        setSelectedRoute(selectedRouteId);
        const response = await fetch(
          `https://ff4b-71-85-245-93.ngrok-free.app/api/addressesByRouteId?route_id=${selectedRouteId}`
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

          const casesArray = Object.entries(casesData).map(([caseNumber, rows]) => ({
            id: parseInt(caseNumber),
            caseNumber,
            rows: [1, 2, 3, 4, 5], // Ensure each case has 5 rows
          }));

          setCases(casesArray);
        } else {
          console.error("Failed to fetch addresses");
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
      }
    };

    fetchAddressesByRouteId();
  }, []);

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
    navigation.navigate('Addresses', {
      caseNumber,
      rowNumber,
    });
  };
  

  return (
    <View style={styles.container}>
      <Text>Post Office: {selectedPostOffice}</Text>
      <Text>Route: {selectedRoute}</Text>
      <View style={styles.caseContainer}>
        <Text style={styles.caseTitle}>Case: {cases[currentCaseIndex]?.caseNumber}</Text>
        <TouchableOpacity style={styles.case}>
          {cases[currentCaseIndex]?.rows.map((rowNumber) => (
            <TouchableOpacity
              key={rowNumber}
              style={styles.row}
              onPress={() => handleRowPress(cases[currentCaseIndex]?.caseNumber, rowNumber)}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  caseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  caseTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  case: {
    width: 200,
    height: 200, // Adjust the height as needed
    backgroundColor: 'lightgray',
    justifyContent: 'space-between',
  },
  row: {
    flex: 1,
    backgroundColor: 'lightblue',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'gray',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginTop: 10,
  },
  navigationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'blue',
  },
});
