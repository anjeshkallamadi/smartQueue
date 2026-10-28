import { StyleSheet } from "react-native";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "./theme";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.7,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.body,
    lineHeight: 24,
    color: COLORS.secondaryText,
    marginBottom: SPACING.xl,
  },
  input: {
    height: 54,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    color: COLORS.text,
    fontSize: TYPOGRAPHY.body,
  },
  button: {
    height: 54,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: "700",
    color: COLORS.surface,
  },
  registerText: {
    textAlign: "center",
    marginTop: SPACING.lg,
    color: COLORS.primaryDark,
    fontWeight: "600",
    fontSize: TYPOGRAPHY.small,
  },
});

export default styles;
