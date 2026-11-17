import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLoginStyles } from "../../styles/loginStyles";
import { useAppTheme } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";

export default function Login() {
  const styles = useLoginStyles();
  const {colors}=useAppTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert("Login failed", error.message);
      return;
    }

    router.replace("/home");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      <Text style={styles.subtitle}>
        Login to continue using SmartQueue
      </Text>

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

      <Pressable
        style={styles.button}
        onPress={handleLogin}
      >
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/register")}>
        <Text style={styles.registerText}>
          Don't have an account? Register
        </Text>
      </Pressable>
    </View>
  );
}