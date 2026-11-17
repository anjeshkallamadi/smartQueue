import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRegisterStyles } from "../../styles/registerStyles";
import { useAppTheme } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";

export default function Register() {
  const styles = useRegisterStyles();
  const {colors}=useAppTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async () => {
  if (!name.trim() || !email.trim() || !password || !confirmPassword) {
    Alert.alert("Error", "Please fill in all fields");
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert("Error", "Passwords do not match");
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        name: name.trim(),
      },
    },
  });

  if (error) {
    Alert.alert("Registration failed", error.message);
    return;
  }

  if (data.session) {
    Alert.alert("Success", "Your account has been created.");
    router.replace("/home");
  } else {
    Alert.alert(
      "Check your email",
      "confirmation is required, verify your email before logging in."
    );
    router.replace("/login");
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <Text style={styles.subtitle}>
        Create your SmartQueue account
      </Text>

      <TextInput placeholderTextColor={colors.secondaryText}
        style={styles.input}
        placeholder="Full Name"
        autoCapitalize="words"
        value={name}
        onChangeText={setName}
      />

      <TextInput placeholderTextColor={colors.secondaryText}
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput placeholderTextColor={colors.secondaryText}
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput placeholderTextColor={colors.secondaryText}
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <Pressable
        style={styles.button}
        onPress={handleRegister}
      >
        <Text style={styles.buttonText}>Create Account</Text>
      </Pressable>

      <Pressable onPress={() => router.replace("/login")}>
        <Text style={styles.loginText}>
          Already have an account? Login
        </Text>
      </Pressable>
    </View>
  );
}