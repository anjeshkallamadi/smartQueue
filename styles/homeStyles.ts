import { StyleSheet } from "react-native";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "./theme";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xl,
  },
  logoText: {
    fontSize: 23,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: COLORS.primary,
  },
  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.softBlue,
    borderWidth: 1,
    borderColor: "#D5E8FA",
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: { fontSize: TYPOGRAPHY.body, color: COLORS.secondaryText, marginBottom: 6 },
  title: {
    fontSize: 29,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  adminButton: {
    backgroundColor: COLORS.teal,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  adminButtonText: { color: COLORS.surface, fontSize: TYPOGRAPHY.body, fontWeight: "700" },
  searchInput: {
    height: 52,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
    color: COLORS.text,
    fontSize: TYPOGRAPHY.body,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.heading,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  errorText: { color: COLORS.danger, marginBottom: SPACING.sm },
  emptyText: { marginBottom: SPACING.md, color: COLORS.secondaryText },
});

export default styles;
