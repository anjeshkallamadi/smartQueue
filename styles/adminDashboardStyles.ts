
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

  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  callButton: {
    backgroundColor: "#2563EB",
  },

  skipButton: {
    backgroundColor: "#D97706",
  },

  disabled: {
    backgroundColor: "#94A3B8",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  helperText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 12,
    lineHeight: 18,
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
  
  toggleButton: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  pauseButton: {
    backgroundColor: "#64748B",
  },

  resumeButton: {
    backgroundColor: "#15803D",
  },

});

export default styles;
