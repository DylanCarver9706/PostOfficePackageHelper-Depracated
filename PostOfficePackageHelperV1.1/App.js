import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from './screens/HomeScreen';
import { CaseBuilderScreen } from './screens/CaseBuilderScreen';
import { PackageHelperScreen } from './screens/PackageHelperScreen';
import { SignUpScreen } from './screens/SignUpScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Case Builder" component={CaseBuilderScreen} />
        <Stack.Screen name="Package Helper" component={PackageHelperScreen} />
        <Stack.Screen name="Sign Up" component={SignUpScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
