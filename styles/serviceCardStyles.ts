import { StyleSheet } from "react-native";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "./theme";

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: "#7898B8",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  serviceName: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 6,
  },
  serviceDescription: {
    fontSize: TYPOGRAPHY.small,
    color: COLORS.secondaryText,
    marginBottom: SPACING.md,
    lineHeight: 21,
  },
  joinButton: {
    height: 46,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.softBlue,
    borderWidth: 1,
    borderColor: "#D1E6FA",
    alignItems: "center",
    justifyContent: "center",
  },
  joinButtonText: { fontSize: 15, fontWeight: "700", color: COLORS.primaryDark },
});

export default styles;
