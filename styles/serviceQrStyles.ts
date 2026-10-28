import { StyleSheet } from "react-native";
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F6FC" },
  content: { paddingHorizontal: 22, paddingTop: 45, paddingBottom: 50 },
  back: { fontSize: 15, color: "#2563EB", fontWeight: "600", marginBottom: 20 },
  heading: { fontSize: 29, fontWeight: "800", color: "#0F172A" },
  subtitle: { color: "#64748B", fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 25 },
  card: { alignItems: "center", padding: 22, borderRadius: 20,
    backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0" },
  qrCanvas: { padding: 8, borderRadius: 14, borderWidth: 1, borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF", marginBottom: 22 },
  scanTitle: { fontSize: 20, fontWeight: "800", color: "#0F766E", letterSpacing: 1 },
  help: { marginTop: 12, fontSize: 14, lineHeight: 22, color: "#475569", textAlign: "center" },
  id: { marginTop: 17, color: "#64748B", fontSize: 11, textAlign: "center" },
  primaryButton: { width: "100%", marginTop: 24, borderRadius: 12,
    backgroundColor: "#0F766E", alignItems: "center", padding: 16 },
  primaryText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  secondaryButton: { padding: 14, marginTop: 10 },
  secondaryText: { color: "#2563EB", fontWeight: "700" },
  error: { color: "#B91C1C", fontSize: 14, textAlign: "center" },
});
export default styles;
