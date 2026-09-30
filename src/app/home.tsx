import {
  ScrollView,
  Text,
  View,
  TextInput,
  Pressable,
} from "react-native";
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

      <View style={styles.queueCard}>
        <Text style={styles.serviceName}>
          Hospital
        </Text>

        <Text style={styles.serviceDescription}>
          Join a hospital service queue remotely and
          track your position.
        </Text>

        <Pressable style={styles.joinButton}>
          <Text style={styles.joinButtonText}>
            Join Queue
          </Text>
        </Pressable>
      </View>

      <View style={styles.queueCard}>
        <Text style={styles.serviceName}>
          Bank
        </Text>

        <Text style={styles.serviceDescription}>
          Check the current queue and join before
          reaching the branch.
        </Text>

        <Pressable style={styles.joinButton}>
          <Text style={styles.joinButtonText}>
            Join Queue
          </Text>
        </Pressable>
      </View>

      <View style={styles.queueCard}>
        <Text style={styles.serviceName}>
          Government Office
        </Text>

        <Text style={styles.serviceDescription}>
          Reduce waiting time by joining the queue
          before you arrive.
        </Text>

        <Pressable style={styles.joinButton}>
          <Text style={styles.joinButtonText}>
            Join Queue
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}