import { useAppTheme } from "../src/context/ThemeContext";
import { StyleSheet } from "react-native";
export function useServiceQrStyles(){const {colors:COLORS}=useAppTheme();return StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 22, paddingTop: 45, paddingBottom: 50 },
  back: { fontSize: 15, color: COLORS.primaryDark, fontWeight: "600", marginBottom: 20 },
  heading: { fontSize: 29, fontWeight: "800", color: COLORS.text },
  subtitle: { color: COLORS.secondaryText, fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 25 },
  card: { alignItems: "center", padding: 22, borderRadius: 20,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  qrCanvas: { padding: 8, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: "#FFFFFF", marginBottom: 22 },
  scanTitle: { fontSize: 20, fontWeight: "800", color: COLORS.teal, letterSpacing: 1 },
  help: { marginTop: 12, fontSize: 14, lineHeight: 22, color: COLORS.secondaryText, textAlign: "center" },
  id: { marginTop: 17, color: COLORS.secondaryText, fontSize: 11, textAlign: "center" },
  primaryButton: { width: "100%", marginTop: 24, borderRadius: 12,
    backgroundColor: "#0F766E", alignItems: "center", padding: 16 },
  primaryText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  secondaryButton: { padding: 14, marginTop: 10 },
  secondaryText: { color: COLORS.primaryDark, fontWeight: "700" },
  error: { color: COLORS.danger, fontSize: 14, textAlign: "center" },
});}
