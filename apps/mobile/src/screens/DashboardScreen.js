import React, { useContext } from 'react';
import { View, Text, Button } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function DashboardScreen() {
  const { user, logout, deleteAccount } = useContext(AuthContext);

  return (
    <View style={{ padding: 20, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Welcome, {user?.name}</Text>
      
      {/* The Conversational AI Music Tutor floating chat UI will eventually anchor here */}

      <View style={{ marginTop: 40, width: '100%' }}>
        <Button title="Logout" onPress={logout} color="gray" />
      </View>
      <View style={{ marginTop: 20, width: '100%' }}>
        <Button title="Delete Account" onPress={deleteAccount} color="red" />
      </View>
    </View>
  );
}