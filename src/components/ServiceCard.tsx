import { Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";
export default function ServiceCard({name,description,onPress}:{name:string;description:string;onPress:()=>void}){
 const {colors,dark}=useAppTheme();
 return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={"View queue for "+name} style={{backgroundColor:colors.surface,borderColor:colors.border,borderWidth:1,borderRadius:18,padding:16,marginBottom:12}}>
 <View style={{flexDirection:"row",gap:12,alignItems:"center"}}><View style={{backgroundColor:colors.softTeal,width:46,height:46,borderRadius:14,alignItems:"center",justifyContent:"center"}}><Ionicons name="business-outline" size={24} color={colors.teal}/></View><View style={{flex:1}}><Text style={{fontSize:17,fontWeight:"700",color:colors.text}}>{name}</Text><Text numberOfLines={2} style={{fontSize:13,color:colors.secondaryText,marginTop:4}}>{description||"Join the virtual queue"}</Text></View><Ionicons name="chevron-forward" size={20} color={colors.primaryDark}/></View>
 <View style={{marginTop:14,alignSelf:"flex-start",backgroundColor:colors.softBlue,borderRadius:10,paddingHorizontal:14,paddingVertical:9}}><Text style={{color:colors.primaryDark,fontWeight:"700"}}>View queue →</Text></View></Pressable>;
}