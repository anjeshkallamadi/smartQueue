import { StyleSheet } from "react-native";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "./theme";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xl,
  },

  backButton: {
    marginRight: SPACING.md,
  },

  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
  },

  headerTitle: {
    fontSize: TYPOGRAPHY.heading,
    fontWeight: "700",
    color: COLORS.text,
  },

  profileSection: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },

  avatarText: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.surface,
  },

  name: {
    fontSize: TYPOGRAPHY.heading,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },

  email: {
    fontSize: TYPOGRAPHY.body,
    color: COLORS.secondaryText,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },

  cardTitle: {
    fontSize: TYPOGRAPHY.subheading,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },

  cardText: {
    fontSize: TYPOGRAPHY.body,
    color: COLORS.secondaryText,
    lineHeight: 22,
  },

  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: SPACING.lg,
  },

  optionText: {
    fontSize: TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: "500",
  },

  optionArrow: {
    fontSize: 20,
    color: COLORS.secondaryText,
  },

  logoutButton: {
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.lg,
  },

  logoutText: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: "600",
    color: COLORS.danger,
  },

  activeQueueItem: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
  },

  queueServiceName: {
    fontSize: TYPOGRAPHY.subheading,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },

  queueInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.xs,
  },

  queueInfoLabel: {
    fontSize: TYPOGRAPHY.body,
    color: COLORS.secondaryText,
    marginRight: SPACING.md,
    flexShrink: 1,
  },

  queueInfoValue: {
    fontSize: TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: "600",
    textAlign: "right",
    flexShrink: 1,
  },

});

export default styles;