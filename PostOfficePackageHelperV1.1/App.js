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
import ProfileScreen from "./screens/ProfileScreen";
import { NewOfficeScreen } from "./screens/NewOfficeScreen";
import { NewRouteScreen } from "./screens/NewRouteScreen";
import { TutorialScreen } from "./screens/TutorialScreen";
import { WelcomeScreen } from "./screens/WelcomeScreen";
import { AccountCreatedScreen } from "./screens/AccountCreatedScreen";
import { onAuthStateChanged } from 'firebase/auth'
import { FIREBASE_AUTH } from "./FirebaseConfig";
// if(__DEV__) {
//   import('../ReactotronConfig').then(() => console.log('Reactotron Configured'))
// }
// import Reactotron from 'reactotron-react-native'
// Reactotron.log('hello rendering world')

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    onAuthStateChanged(FIREBASE_AUTH, (user) =>{
      // console.log("user: " + JSON.stringify(user, null, 2))
      setUser(user)
    })
  })

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={user ? "Home" : "HaveAccountScreen"}>
        <Stack.Screen name="Home" component={HomeScreen}/>
        <Stack.Screen name="Case Builder" component={CaseBuilderScreen} />
        <Stack.Screen name="Package Helper" component={PackageHelperScreen} />
        <Stack.Screen name="Barcode Scanner" component={BarcodeScannerScreen} />
        <Stack.Screen name="Scan Label" component={ScanLabelScreen} />
        <Stack.Screen name="Select Office Route" component={SelectOfficeRouteScreen}/>
        <Stack.Screen name="Addresses" component={AddressesScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Signup Screen" component={SignUpScreen} />
        <Stack.Screen name="New Office Screen" component={NewOfficeScreen} />
        <Stack.Screen name="New Route Screen" component={NewRouteScreen} />
        <Stack.Screen name="HaveAccountScreen" component={HaveAccountScreen} />
        <Stack.Screen name="Tutorial Screen" component={TutorialScreen} />
        <Stack.Screen name="Welcome Screen" component={WelcomeScreen} />
        <Stack.Screen name="Account Created Screen" component={AccountCreatedScreen} />
        <Stack.Screen name="Login Screen" component={LoginScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
