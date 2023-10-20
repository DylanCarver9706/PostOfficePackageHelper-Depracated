import React, {useEffect, useState} from 'react';
import { View, Text, Button } from 'react-native';

export function HomeScreen({ navigation }) {

  const [isLoading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  // let getUsers = () => {
  //   fetch('http://localhost:3000/api/users')
  //   .then(res => {
  //     console.log(res.status);
  //     console.log(res.headers);
  //     return res.json();
  //   })
  //   .then(
  //     (result) => {
  //       console.log(result);
  //     },
  //     (error) => {
  //       console.log(error);
  //     }
  //   )
  // }

  const getUsers = async () => {
    try {
      const response = await fetch('http://162.192.102.233/api/users');
      const json = await response.json();
      setData(json);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Home Screen</Text>
      <Button
        title="Case Builder"
        onPress={() => navigation.navigate('Case Builder')}
      />
      <Button
        title="Package Helper"
        onPress={() => navigation.navigate('Package Helper')}
      />
      <Button
        title="Sign Up"
        onPress={() => navigation.navigate('Sign Up')}
      />
      <Button
        title="Get Users"
        onPress={getUsers}
      />
    </View>
  );
}
