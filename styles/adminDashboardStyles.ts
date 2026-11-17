import { useAppTheme } from "../src/context/ThemeContext";

import { StyleSheet } from "react-native";

export function useAdminDashboardStyles(){const {colors:COLORS}=useAppTheme();return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 40,
  },

  back: {
    color: COLORS.primaryDark,
    fontSize: 16,
    marginBottom: 20,
  },

  title: {
    fontSize: 27,
    fontWeight: "bold",
    color: COLORS.text,
  },

  subtitle: {
    fontSize: 15,
    color: COLORS.secondaryText,
    marginTop: 8,
    marginBottom: 24,
  },

  createServiceButton: {
    backgroundColor: "#0F766E",
    paddingVertical: 17,
    paddingHorizontal: 15,
    borderRadius: 13,
    alignItems: "center",
    marginBottom: 22,
  },
  serviceQRButton: {
    borderWidth: 1,
    borderColor: "#0F766E",
    paddingVertical: 14,
    borderRadius: 11,
    alignItems: "center",
    marginTop: 12,
  },
  qrButtonText: {
    color: COLORS.teal,
    fontSize: 15,
    fontWeight: "700",
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  serviceName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 14,
    color: COLORS.text,
  },

  detail: {
    fontSize: 15,
    marginBottom: 10,
    color: COLORS.text,
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
    color: COLORS.secondaryText,
    marginTop: 12,
    lineHeight: 18,
  },

  error: {
    color: COLORS.danger,
    marginTop: 15,
  },

  message: {
    color: COLORS.secondaryText,
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

});}
