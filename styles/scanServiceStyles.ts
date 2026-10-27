import { StyleSheet } from "react-native";
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F6FC", padding: 22,
    paddingTop: 65, alignItems: "center" },
  center: { flex: 1, backgroundColor: "#F2F6FC", padding: 35,
    alignItems: "center", justifyContent: "center" },
  heading: { color: "#0F172A", fontSize: 28, fontWeight: "800", textAlign: "center" },
  title: { color: "#0F172A", fontSize: 24, fontWeight: "800", textAlign: "center" },
  help: { color: "#64748B", fontSize: 15, textAlign: "center",
    lineHeight: 22, marginTop: 12, marginBottom: 20 },
  cameraFrame: { width: "100%", maxWidth: 410, height: 350, borderRadius: 20,
    overflow: "hidden", marginTop: 24, marginBottom: 22,
    backgroundColor: "#111827", position: "relative" },
  camera: { flex: 1 },
  scanBorder: { position: "absolute", width: 200, height: 200, top: "21%",
    alignSelf: "center", borderWidth: 3, borderColor: "#FFFFFF", borderRadius: 18 },
  button: { backgroundColor: "#2563EB", paddingHorizontal: 28, paddingVertical: 15,
    borderRadius: 12, alignItems: "center", marginTop: 15 },
  buttonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  back: { color: "#2563EB", fontWeight: "700", marginTop: 16, fontSize: 15 },
});
export default styles;
