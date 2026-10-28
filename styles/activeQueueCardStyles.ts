import { StyleSheet } from "react-native";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "./theme";

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.softTeal,
    borderWidth: 1,
    borderColor: "#D0EEE8",
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  text: {
    fontSize: TYPOGRAPHY.small,
    lineHeight: 22,
    color: COLORS.secondaryText,
  },
});

export default styles;
