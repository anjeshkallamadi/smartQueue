
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ActiveQueueCard from "../components/ActiveQueueCard";
import ServiceCard from "../components/ServiceCard";
import styles from "../../styles/homeStyles";

const services = [
  {
    queueId: "hospital",
    name: "Harsha's Hospital",
    description:
      "Join a hospital queue remotely and track your position.",
  },
  {
    queueId: "bank",
    name: "Vamsi's Bank",
    description:
      "Check the current queue and join before reaching the branch.",
  },
  {
    queueId: "government-office",
    name: "Anjesh's Office",
    description:
      "Reduce waiting time by joining the queue before you arrive.",
  },
];

export default function Home() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.logoText}>SmartQueue</Text>

        <Pressable
          style={styles.profileButton}
          accessibilityRole="button"
          accessibilityLabel="Open your account"
          onPress={() => router.push("/profile")}
        >
          <Ionicons name="person" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      <Text style={styles.greeting}>Welcome to SmartQueue 👋</Text>

      <Text style={styles.title}>
        Find a service and skip the waiting line.
      </Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search services..."
        accessibilityLabel="Search services"
      />

      <Text style={styles.sectionTitle}>My Active Queue</Text>

      <ActiveQueueCard />

      <Text style={styles.sectionTitle}>Available Services</Text>

      {services.map((service) => (
        <ServiceCard
          key={service.queueId}
          name={service.name}
          description={service.description}
          onPress={() =>
            router.push({
              pathname: "/queue-details",
              params: {
                queueId: service.queueId,
                serviceName: service.name,
                description: service.description,
              },
            })
          }
        />
      ))}
    </ScrollView>
  );
}
