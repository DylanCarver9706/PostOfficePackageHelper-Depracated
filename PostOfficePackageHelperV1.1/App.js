import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { HomeScreen } from "./screens/HomeScreen";
import { CaseBuilderScreen } from "./screens/CaseBuilderScreen";
import { ScanLabelScreen } from "./screens/ScanLabelScreen";
import { SelectOfficeRouteScreen } from "./screens/SelectOfficeRouteScreen";
import { AddressesScreen } from "./screens/AddressesScreen";
import { HaveAccountScreen } from "./screens/HaveAccountScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { SignUpScreen } from "./screens/SignUpScreen";
import { PackageHelperScreen } from "./screens/PackageHelperScreen";
import { BarcodeScannerScreen } from "./screens/BarcodeScannerScreen";
import API_BASE_URL from "./apiConfig";
// if(__DEV__) {
//   import('../ReactotronConfig').then(() => console.log('Reactotron Configured'))
// }
// import Reactotron from 'reactotron-react-native'
// Reactotron.log('hello rendering world')

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);

  // useEffect(() => {
  // Check if the user session is active (you can make an API call to /api/check-auth)
  // If the user is authenticated, set user to true
  // If the user is not authenticated, set user to null
  // Replace the following logic with your actual authentication check
  //   const checkUserAuthentication = async () => {
  //     try {
  //       const response = await fetch(
  //         `${API_BASE_URL}/check-auth?user_id=1`
  //       );
  //       const data = await response.json();
  //       if (data.isAuthenticated) {
  //         setUser(true);
  //         navigation.navigate("Home");
  //       } else {
  //         setUser(null);
  //       }
  //     } catch (error) {
  //       console.error("Error checking authentication:", error);
  //     }
  //   };

  //   checkUserAuthentication();
  // }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={user ? "Home" : "HaveAccountScreen"}>
        <Stack.Screen name="Home">
          {(props) => <HomeScreen {...props} setUser={setUser} />}
        </Stack.Screen>
        <Stack.Screen name="Case Builder" component={CaseBuilderScreen} />
        <Stack.Screen name="Package Helper" component={PackageHelperScreen} />
        <Stack.Screen name="Barcode Scanner" component={BarcodeScannerScreen} />
        <Stack.Screen name="Scan Label" component={ScanLabelScreen} />
        {/* <Stack.Screen name="Sign Up" component={SignupScreen} /> */}
        <Stack.Screen
          name="Select Office Route"
          options={{ title: "Select Office Route" }}
        >
          {(props) => <SelectOfficeRouteScreen {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen name="Addresses" component={AddressesScreen} />
        <Stack.Screen name="Signup Screen" component={SignUpScreen} />
        <Stack.Screen name="HaveAccountScreen" component={HaveAccountScreen} />
        <Stack.Screen name="Login Screen">
          {(props) => <LoginScreen {...props} setUser={setUser} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
