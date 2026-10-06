import {
  ScrollView,
  Text,
  View,
  TextInput,
  Pressable,
} from "react-native";
import ServiceCard from "../components/ServiceCard";
import styles from "../../styles/homeStyles";

export default function Home() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.greeting}>Welcome to SmartQueue 👋</Text>

      <Text style={styles.title}>
        Find a service and skip the waiting line.
      </Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search services..."
      />

      <Text style={styles.sectionTitle}>My Active Queue</Text>

      <View style={styles.activeQueueCard}>
        <Text style={styles.activeQueueTitle}>
          No active queue
        </Text>

        <Text style={styles.emptyText}>
          You are not currently waiting in any queue.
          Join a service below to get started.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        Available Services
      </Text>

      <ServiceCard
        name="Hospital"
        description="Join a hospital service queue remotely and track your position."
      />

      <ServiceCard
        name="Bank"
        description="Check the current queue and join before reaching the branch."
      />

      <ServiceCard
        name="Government Office"
        description="Reduce waiting time by joining the queue before you arrive."
      />
    </ScrollView>
  );
}