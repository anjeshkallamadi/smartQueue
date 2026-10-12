
import { ScrollView, Text, TextInput } from "react-native";
import { router } from "expo-router";

import ActiveQueueCard from "../components/ActiveQueueCard";
import ServiceCard from "../components/ServiceCard";
import styles from "../../styles/homeStyles";

export default function Home() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.greeting}>Welcome back</Text>

      <Text style={styles.title}>
        Find a service and skip the waiting line.
      </Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search services..."
      />

      <Text style={styles.sectionTitle}>My Active Queue</Text>

      <ActiveQueueCard />

      <Text style={styles.sectionTitle}>
        Available Services
      </Text>

      <ServiceCard
        name="Harsha's Hospital"
        description="Join a hospital service queue remotely and track your position."
        onPress={() =>
          router.push({
            pathname: "/queue-details",
            params: {
              queueId: "hospital",
              serviceName: "Harsha's Hospital",
              description:
                "Join a hospital service queue remotely and track your position.",
            },
          })
        }
      />

      <ServiceCard
        name="Vamsi's Bank"
        description="Check the current queue and join before reaching the branch."
        onPress={() =>
          router.push({
            pathname: "/queue-details",
            params: {
              queueId: "bank",
              serviceName: "Vamsi's Bank",
              description:
                "Check the current queue and join before reaching the branch.",
            },
          })
        }
      />

      <ServiceCard
        name="Anjesh's Office"
        description="Reduce waiting time by joining the queue before you arrive."
        onPress={() =>
          router.push({
            pathname: "/queue-details",
            params: {
              queueId: "government-office",
              serviceName: "Anjesh's Office",
              description:
                "Reduce waiting time by joining the queue before you arrive.",
            },
          })
        }
      />
    </ScrollView>
  );
}
