import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 24,
    paddingBottom: 30,
  },

  greeting: {
    fontSize: 16,
    marginBottom: 6,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
  },

  searchInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 28,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
  },

  queueCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },

  serviceName: {
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 6,
  },

  serviceDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },

  joinButton: {
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  joinButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },

  activeQueueCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 28,
  },

  activeQueueTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
  },

  activeQueueText: {
    fontSize: 14,
    lineHeight: 21,
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default styles;