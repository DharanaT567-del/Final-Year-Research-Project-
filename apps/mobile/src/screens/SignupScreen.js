import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView, Platform, StatusBar } from 'react-native';
import axiosClient from '../api/axiosClient';
import { AuthContext } from '../context/AuthContext';

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (!agreed) {
      Alert.alert('Error', 'Please agree to the Terms & Conditions.');
      return;
    }
    setLoading(true);
    try {
      await axiosClient.post('/auth/signup', { name, email, password });
      await login(email, password);
    } catch (error) {
      Alert.alert('Signup Error', error.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logoText}>Naada</Text>
          <Text style={styles.tagline}>Unlock your sonic potential.</Text>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Create Account</Text>
          <View style={styles.titleUnderline} />
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.icon}>👤</Text>
            <TextInput 
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#777"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.icon}>✉</Text>
            <TextInput 
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#777"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.icon}>🔒</Text>
            <TextInput 
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#777"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.iconRight}>👁</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.checkboxContainer}>
            <TouchableOpacity 
              style={[styles.checkbox, agreed && styles.checkboxChecked]} 
              onPress={() => setAgreed(!agreed)}
            >
              {agreed && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <Text style={styles.checkboxText}>
              I agree to the <Text style={styles.linkText}>Terms & Conditions</Text> and <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>
          </View>

          <TouchableOpacity style={styles.signupButton} onPress={handleSignup} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signupButtonText}>Create Account ➔</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: '#c074ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: '#aaa',
  },
  titleContainer: {
    marginBottom: 24,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  titleUnderline: {
    height: 3,
    width: 40,
    backgroundColor: '#00e5ff',
    marginTop: 8,
    borderRadius: 2,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  icon: {
    fontSize: 18,
    color: '#888',
    marginRight: 12,
  },
  iconRight: {
    fontSize: 18,
    color: '#888',
    marginLeft: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingRight: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  checkmark: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxText: {
    color: '#aaa',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  linkText: {
    color: '#00e5ff',
  },
  signupButton: {
    backgroundColor: '#9b51e0',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9b51e0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    color: '#aaa',
    fontSize: 14,
  },
  footerLink: {
    color: '#e0c8ff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});