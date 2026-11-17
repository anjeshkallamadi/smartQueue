import { StyleSheet } from "react-native";
import { useAppTheme } from "../src/context/ThemeContext";
export function useHomeStyles(){const {colors:C}=useAppTheme();return StyleSheet.create({
 container:{flex:1,backgroundColor:C.background},content:{padding:20,paddingBottom:36,gap:10},
 header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:8},
 logoText:{fontSize:23,fontWeight:"800",color:C.primaryDark},profileButton:{width:42,height:42,borderRadius:21,backgroundColor:"#286DB7",alignItems:"center",justifyContent:"center"},
 iconButton:{width:38,height:42,borderRadius:21,backgroundColor:C.softBlue,alignItems:"center",justifyContent:"center"},
 hero:{backgroundColor:"#164A71",padding:22,borderRadius:24,marginBottom:8},greeting:{fontSize:11,fontWeight:"700",letterSpacing:1.3,color:"#9CD9DE",marginBottom:8},title:{fontSize:29,fontWeight:"800",color:"#FFFFFF",marginBottom:8},heroText:{fontSize:14,lineHeight:21,color:"#D6E8F4"},
 heroStats:{flexDirection:"row",borderTopWidth:1,borderColor:"#487292",paddingTop:16,marginTop:18,gap:12},statNumber:{fontSize:27,fontWeight:"800",color:"#FFFFFF"},statLabel:{fontSize:12,color:"#D6E8F4"},
 adminButton:{backgroundColor:"#147D75",padding:14,borderRadius:14,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:10},adminButtonText:{color:"#FFFFFF",fontSize:15,fontWeight:"700"},
 searchBox:{flexDirection:"row",alignItems:"center",gap:10,backgroundColor:C.surface,borderColor:C.border,borderWidth:1,paddingHorizontal:14,borderRadius:14,marginVertical:6},searchInput:{flex:1,height:50,color:C.text,fontSize:16},
 sectionTitle:{fontSize:20,fontWeight:"800",color:C.text,marginTop:8},errorText:{color:C.danger},emptyText:{color:C.secondaryText,marginBottom:12}
});}
