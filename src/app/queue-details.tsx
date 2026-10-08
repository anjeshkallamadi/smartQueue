import { useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";

import styles from "../../styles/queueDetailsStyles";

import {
  joinQueue,
  getPeopleAhead,
  getEstimatedWaitTime,
  getQueueStatus,
} from "../services/queueService";

const DEMO_USER_ID = "demo-user-001";

export default function QueueDetails() {
  const { serviceName, description } = useLocalSearchParams<{
    serviceName?: string;
    description?: string;
  }>();

  const [token, setToken] = useState<string | null>(null);
  const [peopleAhead, setPeopleAhead] = useState(0);
  const [estimatedWait, setEstimatedWait] = useState(0);
  const [status, setStatus] = useState("Not in queue");

  const handleJoinQueue = () => {
    const entry = joinQueue(DEMO_USER_ID);

    setToken(entry.token);
    setPeopleAhead(getPeopleAhead(DEMO_USER_ID));
    setEstimatedWait(getEstimatedWaitTime(DEMO_USER_ID));
    setStatus(getQueueStatus(DEMO_USER_ID));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.serviceName}>
        {serviceName ?? "Service"}
      </Text>

      <Text style={styles.description}>
        {description ?? "View the current queue and join remotely."}
      </Text>

      <Text style={styles.sectionTitle}>
        Current Queue
      </Text>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Average service time
          </Text>

          <Text style={styles.infoValue}>
            5 min
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Queue status
          </Text>

          <Text style={styles.infoValue}>
            Open
          </Text>
        </View>
      </View>

      <Pressable
        style={styles.joinButton}
        onPress={handleJoinQueue}
      >
        <Text style={styles.joinButtonText}>
          Join Queue
        </Text>
      </Pressable>

      {token && (
        <View style={styles.resultCard}>
          <Text style={styles.tokenLabel}>
            Your Token
          </Text>

          <Text style={styles.token}>
            {token}
          </Text>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>
              People Ahead
            </Text>

            <Text style={styles.resultValue}>
              {peopleAhead}
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>
              Estimated Wait
            </Text>

            <Text style={styles.resultValue}>
              {estimatedWait} min
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>
              Status
            </Text>

            <Text style={styles.resultValue}>
              {status}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
