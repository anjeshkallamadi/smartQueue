
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 40,
  },
  back: {
    color: "#2563EB",
    fontSize: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 8,
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  serviceName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 14,
    color: "#0F172A",
  },
  detail: {
    fontSize: 15,
    marginBottom: 10,
    color: "#334155",
  },
  button: {
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 10,
    marginTop: 12,
    alignItems: "center",
  },
  disabled: {
    backgroundColor: "#94A3B8",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#DC2626",
    marginTop: 15,
  },
  message: {
    color: "#64748B",
    fontSize: 15,
    marginTop: 15,
  },
});

export default styles;
