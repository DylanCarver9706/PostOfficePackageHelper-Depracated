import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";

// Fake data for cases and case rows
const mockCases = [
  { id: 1, caseNumber: 'Case 1', rows: [1, 2, 3, 4, 5] },
  { id: 2, caseNumber: 'Case 2', rows: [1, 2, 3, 4, 5] },
  // Add more cases as needed
];

export function CaseBuilderScreen({ route }) {

  useEffect(() => {
    // Retrieve user information from AsyncStorage
    const getUserInfo = async () => {
      try {
        const email = await AsyncStorage.getItem("userEmail");
        const id = await AsyncStorage.getItem("userId");
        const selectedOffice = await AsyncStorage.getItem("selectedOffice");
        const selectedRoute = await AsyncStorage.getItem("selectedRoute");

        console.log("Email in CaseBuilder: ", email);
        console.log("Id in CaseBuilder: ", id);
        console.log("selectedOffice in CaseBuilder: ", selectedOffice)
        console.log("selectedRoute in CaseBuilder: ", selectedRoute)
        // if (email && id) {
          // setUserEmail(email);
          // setUserId(id);
        // }
      } catch (error) {
        console.error("Error retrieving user information:", error);
      }
    };

    getUserInfo();
  }, []);

  const { postOffice, route: selectedRoute } = route.params;
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);

  const navigation = useNavigation();

  const handlePrevCase = () => {
    if (currentCaseIndex > 0) {
      setCurrentCaseIndex(currentCaseIndex - 1);
    }
  };

  const handleNextCase = () => {
    if (currentCaseIndex < mockCases.length - 1) {
      setCurrentCaseIndex(currentCaseIndex + 1);
    }
  };

  const handleRowPress = (caseRowNumber) => {
    // Navigate to AddressesScreen with the selected case row number
    navigation.navigate('Addresses', {
      caseRowNumber,
    });
  };

  return (
    <View style={styles.container}>
      <Text>Post Office: {postOffice}</Text>
      <Text>Route: {selectedRoute}</Text>
      <View style={styles.caseContainer}>
        <Text style={styles.caseTitle}>Case: {mockCases[currentCaseIndex].caseNumber}</Text>
        <TouchableOpacity style={styles.case}>
          {mockCases[currentCaseIndex].rows.map((rowNumber) => (
            <TouchableOpacity
              key={rowNumber}
              style={styles.row}
              onPress={() => handleRowPress(rowNumber)}
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
