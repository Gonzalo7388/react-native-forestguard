import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Para iconos de email y contraseña

const LoginScreen = ({
  navigation,
  setIsAuthenticated,
}: {
  navigation: any;
  setIsAuthenticated: (authenticated: boolean) => void;
}) => {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');

  const handleLogin = () => {
    const usuarioPrueba = 'admin';
    const contrasenaPrueba = 'admin';

    if (usuario === usuarioPrueba && contrasena === contrasenaPrueba) {
      setIsAuthenticated(true); // This is sufficient
    } else {
      Alert.alert('Error', 'Credenciales incorrectas'); // Use Alert.alert as it's common in React Native, or replace with custom modal
    }
  };

  return (
    <View style={styles.container}>
      {/* App Logo/Icon - Simulating the shield icon from the mockup */}
      <View style={styles.appIconContainer}>
        <Icon name="shield-check" size={60} color="#7ED321" /> {/* Lime green shield icon */}
      </View>

      {/* Project Name */}
      <Text style={styles.projectName}>Aretz Dend</Text>
      <Text style={styles.tagline}>Secure your digital forest</Text> {/* Tagline from mockup */}

      {/* Welcome Back / Login Text */}
      <Text style={styles.welcomeText}>Welcome Back</Text>
      <Text style={styles.loginSubText}>Login to your account</Text>

      {/* Email Input */}
      <Text style={styles.inputLabel}>Email</Text>
      <View style={styles.inputContainer}>
        <Icon name="email-outline" size={20} color="#000000" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#666666" // Darker placeholder
          value={usuario}
          onChangeText={setUsuario}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Password Input */}
      <Text style={styles.inputLabel}>Password</Text>
      <View style={styles.inputContainer}>
        <Icon name="lock-outline" size={20} color="#000000" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#666666" // Darker placeholder
          secureTextEntry
          value={contrasena}
          onChangeText={setContrasena}
        />
      </View>

      {/* Sign In Button */}
      <TouchableOpacity style={styles.signInButton} onPress={handleLogin}>
        <Text style={styles.signInButtonText}>Sign In</Text>
      </TouchableOpacity>

      {/* Forgot Password */}
      <TouchableOpacity onPress={() => console.log('Forgot Password clicked')}>
        <Text style={styles.forgotPasswordText}>Forgot password?</Text>
      </TouchableOpacity>

      {/* Don't have an account? Sign Up */}
      <View style={styles.signUpContainer}>
        <Text style={styles.signUpText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => console.log('Sign Up clicked')}>
          <Text style={styles.signUpLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <Text style={styles.footerText}>© 2025 Aretz Dend. All rights reserved.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Light grey background from mockup
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  appIconContainer: {
    marginBottom: 10,
  },
  projectName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000', // Black for project name
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    color: '#333333', // Darker grey for tagline
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000', // Black for welcome text
    marginBottom: 5,
  },
  loginSubText: {
    fontSize: 16,
    color: '#666666', // Grey for login subtext
    marginBottom: 30,
  },
  inputLabel: {
    alignSelf: 'flex-start', // Align label to the left
    marginLeft: 20,
    fontSize: 16,
    color: '#000000', // Black for input labels
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%', // Adjusted width
    backgroundColor: '#FFFFFF', // White background
    borderWidth: 1,
    borderColor: '#E0E0E0', // Light grey border
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50, // Slightly taller input
    color: '#000000', // Black text for input
    fontSize: 16,
  },
  signInButton: {
    backgroundColor: '#000000', // Black for Sign In button
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '90%', // Match input width
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  signInButtonText: {
    color: '#FFFFFF', // White text for Sign In button
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotPasswordText: {
    color: '#000000', // Black for forgot password
    fontSize: 14,
    marginBottom: 30,
  },
  signUpContainer: {
    flexDirection: 'row',
    marginBottom: 60, // Space before footer
  },
  signUpText: {
    color: '#666666', // Grey for "Don't have an account?"
    fontSize: 14,
  },
  signUpLink: {
    color: '#7ED321', // Lime green for "Sign Up" link
    fontSize: 14,
    fontWeight: 'bold',
  },
  footerText: {
    position: 'absolute', // Position footer at the bottom
    bottom: 20,
    fontSize: 12,
    color: '#666666', // Grey for footer text
  },
});

export default LoginScreen;
