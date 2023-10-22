import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const mockPostOffices = [
  {
    id: 1,
    name: 'Post Office A',
    routes: [
      { id: 1, name: 'Route 1' },
      { id: 2, name: 'Route 2' },
    ],
  },
  {
    id: 2,
    name: 'Post Office B',
    routes: [
      { id: 3, name: 'Route 3' },
      { id: 4, name: 'Route 4' },
    ],
  },
  {
    id: 3,
    name: 'Post Office C',
    routes: [
      { id: 5, name: 'Route 5' },
      { id: 6, name: 'Route 6' },
    ],
  },
];

export function SelectOfficeRouteScreen() {
    const [selectedPostOffice, setSelectedPostOffice] = useState(null);
    const [selectedRoute, setSelectedRoute] = useState(null);
  
    // Initialize the navigation object
    const navigation = useNavigation();
  
    const handlePostOfficeSelection = (postOffice) => {
      setSelectedPostOffice(postOffice);
    };
  
    const handleRouteSelection = (route) => {
      setSelectedRoute(route);
    };
  
    // Use useEffect to navigate when both office and route are selected
    useEffect(() => {
      if (selectedPostOffice && selectedRoute) {
        navigation.navigate('Case Builder', {
          postOffice: selectedPostOffice.name,
          route: selectedRoute.name,
        });
      }
    }, [selectedPostOffice, selectedRoute, navigation]);
  
    return (
      <View style={{ flex: 1, flexDirection: 'row', padding: 16 }}>
        <View style={{ flex: 1 }}>
          <Text>Select a Post Office:</Text>
          <FlatList
            data={mockPostOffices}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handlePostOfficeSelection(item)}
                style={{
                  padding: 8,
                  marginBottom: 4,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: 'gray',
                  backgroundColor:
                    selectedPostOffice && selectedPostOffice.id === item.id
                      ? 'lightblue'
                      : 'white',
                }}
              >
                <Text>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
        <View style={{ flex: 1 }}>
          {selectedPostOffice && (
            <View>
              <Text>Routes for {selectedPostOffice.name}:</Text>
              <FlatList
                data={selectedPostOffice.routes}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleRouteSelection(item)}
                    style={{
                      padding: 8,
                      marginBottom: 4,
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: 'gray',
                      backgroundColor:
                        selectedRoute && selectedRoute.id === item.id
                          ? 'lightblue'
                          : 'white',
                    }}
                  >
                    <Text>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>
      </View>
    );
  }