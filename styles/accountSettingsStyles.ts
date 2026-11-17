import { StyleSheet } from "react-native";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "./theme";

export default StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl, gap: SPACING.md },
  header: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.sm },
  backButton: { paddingRight: SPACING.md, paddingVertical: SPACING.sm },
  backText: { fontSize: 30, color: COLORS.text },
  headerCopy: { flex: 1 },
  title: { fontSize: TYPOGRAPHY.heading, fontWeight: "700", color: COLORS.text },
  subtitle: { fontSize: TYPOGRAPHY.small, color: COLORS.secondaryText, marginTop: 3 },
  photoCard: { flexDirection: "row", alignItems: "center", gap: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.softBlue, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImage: { width: "100%", height: "100%" },
  avatarInitial: { fontSize: 32, fontWeight: "700", color: COLORS.primary },
  photoCopy: { flex: 1, gap: SPACING.xs },
  sectionTitle: { fontSize: TYPOGRAPHY.subheading, fontWeight: "700", color: COLORS.text },
  helper: { fontSize: TYPOGRAPHY.small, lineHeight: 20, color: COLORS.secondaryText },
  secondaryButton: { alignSelf: "flex-start", borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginTop: SPACING.xs, minWidth: 112, alignItems: "center" },
  secondaryButtonText: { color: COLORS.primaryDark, fontSize: TYPOGRAPHY.small, fontWeight: "700" },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg },
  label: { fontSize: TYPOGRAPHY.small, fontWeight: "600", color: COLORS.text, marginTop: SPACING.md, marginBottom: SPACING.xs },
  input: { minHeight: 48, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: "#FFFFFF", paddingHorizontal: SPACING.md, color: COLORS.text, fontSize: TYPOGRAPHY.body },
  readOnlyInput: { backgroundColor: COLORS.background, color: COLORS.secondaryText },
  primaryButton: { minHeight: 48, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginTop: SPACING.lg },
  primaryButtonText: { color: "#FFFFFF", fontSize: TYPOGRAPHY.body, fontWeight: "700" },
});
