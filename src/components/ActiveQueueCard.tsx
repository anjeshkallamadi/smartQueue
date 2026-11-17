import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";
import { formatQueueToken, type MyActiveQueue } from "../services/supabaseQueueService";
export default function ActiveQueueCard({queue,loading,error}:{queue:MyActiveQueue|null;loading:boolean;error:string|null}){
 const {colors}=useAppTheme();
 const status=queue?.queueStatus==="paused"?"Paused":queue?.status==="called"?"Your turn": "Waiting";
 return <View style={{padding:18,borderRadius:20,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface}}>
 {loading||error||!queue?<View style={{flexDirection:"row",alignItems:"center",gap:14}}><Ionicons name="ticket-outline" size={32} color={colors.primary}/><View style={{flex:1}}><Text style={{color:colors.text,fontWeight:"700",fontSize:17}}>{loading?"Loading queues":error?"Unable to load queues":"No active queue"}</Text><Text style={{color:colors.secondaryText,marginTop:4}}>{error||(!loading?"Choose a service below to get started.":"Please wait…")}</Text></View></View>:<>
 <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:8}}><Text style={{color:colors.text,fontSize:17,fontWeight:"700",flex:1}}>{queue.serviceName}</Text><Text style={{color:status==="Your turn"?colors.success:colors.warning,fontWeight:"700"}}>{status}</Text></View>
 <Text style={{color:colors.secondaryText,marginTop:15}}>YOUR TOKEN</Text><Text style={{fontSize:38,fontWeight:"800",color:colors.primaryDark}}>{formatQueueToken(queue.tokenNumber)}</Text>
 <View style={{flexDirection:"row",borderTopWidth:1,borderColor:colors.border,paddingTop:14,marginTop:12,gap:14}}>{[{label:"People ahead",value:queue.peopleAhead??"—"},{label:"Estimated wait",value:queue.estimatedWaitMinutes==null?"—":queue.estimatedWaitMinutes+" min"}].map(item=><View key={item.label} style={{flex:1}}><Text style={{color:colors.secondaryText,fontSize:13}}>{item.label}</Text><Text style={{color:colors.text,fontSize:22,fontWeight:"700",marginTop:4}}>{item.value}</Text></View>)}</View>
 </>}
 </View>;
}