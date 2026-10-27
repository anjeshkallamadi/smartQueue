import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator, Alert, Pressable, ScrollView,
  Text, TextInput, View,
} from "react-native";
import styles from "../../styles/createServiceStyles";
import { checkIsAdmin } from "../services/adminQueueService";
import { createServiceWithQueue } from "../services/serviceManagementService";

export default function CreateService() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [minutes, setMinutes] = useState("10");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      checkIsAdmin()
        .then((allowed) => { if (active) setIsAdmin(allowed); })
        .catch(() => { if (active) setIsAdmin(false); })
        .finally(() => { if (active) setChecking(false); });
      return () => { active = false; };
    }, [])
  );

  const handleCreate = async () => {
    if (submitting || !isAdmin) return;
    const averageServiceTime = Number(minutes.trim());
    if (!name.trim() || name.trim().length < 3) {
      Alert.alert("Service name required", "Enter at least 3 characters.");
      return;
    }
    if (!Number.isInteger(averageServiceTime) ||
        averageServiceTime < 1 || averageServiceTime > 240) {
      Alert.alert("Invalid time", "Enter between 1 and 240 minutes.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await createServiceWithQueue({
        name, description, category, location, averageServiceTime,
      });
      router.replace({
        pathname: "/service-qr",
        params: { serviceId: created.service_id, serviceName: name.trim() },
      });
    } catch (error) {
      Alert.alert(
        "Unable to create service",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }
  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Admins only</Text>
        <Text style={styles.hint}>You need a service-admin account to create services.</Text>
        <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Admin Dashboard</Text>
      </Pressable>
      <Text style={styles.heading}>Create a Service</Text>
      <Text style={styles.subtitle}>
        Your service will immediately get an active queue and a permanent QR code.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Service name *</Text>
        <TextInput style={styles.input} placeholder="e.g. Hospital Registration"
          value={name} maxLength={100} onChangeText={setName} />

        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, styles.multiline]}
          multiline numberOfLines={3} maxLength={500}
          placeholder="What is this service for?"
          value={description} onChangeText={setDescription} />

        <Text style={styles.label}>Category</Text>
        <TextInput style={styles.input} placeholder="e.g. Healthcare"
          maxLength={60} value={category} onChangeText={setCategory} />

        <Text style={styles.label}>Location</Text>
        <TextInput style={styles.input} placeholder="e.g. Main block, counter 2"
          maxLength={160} value={location} onChangeText={setLocation} />

        <Text style={styles.label}>Average service time (minutes) *</Text>
        <TextInput style={styles.input} keyboardType="number-pad"
          value={minutes} maxLength={3} onChangeText={setMinutes} />

        <Pressable style={[styles.primaryButton, submitting && styles.disabled]}
          onPress={() => void handleCreate()} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#FFFFFF" /> :
            <Text style={styles.primaryText}>Create Service & Generate QR</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
}
