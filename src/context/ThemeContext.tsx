import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { COLORS } from "../../styles/theme";
const darkColors: typeof COLORS = {
  primary: "#76B9FA", primaryDark: "#9ACCFF", teal: "#55D6C3",
  background: "#0C1524", surface: "#162438", text: "#F1F6FC",
  secondaryText: "#A9BCD1", border: "#30465E", success: "#71E3B0",
  warning: "#FFC36A", danger: "#FF9A9A", softBlue: "#203B59", softTeal: "#153D3D",
};
type ThemeValue = { dark: boolean; colors: typeof COLORS; setDark: (value: boolean) => void };
const ThemeContext = createContext<ThemeValue>({dark:false,colors:COLORS,setDark:()=>{}});
const KEY = "smartqueue.theme";
export function AppThemeProvider({children}:{children:ReactNode}) {
 const [dark,setValue] = useState(false);
 const [ready,setReady] = useState(false);
 useEffect(()=>{let active=true; AsyncStorage.getItem(KEY).then(v=>{if(active)setValue(v==="dark");}).catch(()=>{}).finally(()=>{if(active)setReady(true);});return()=>{active=false;};},[]);
 function setDark(value:boolean){setValue(value);void AsyncStorage.setItem(KEY,value?"dark":"light").catch(()=>{});}
 return <ThemeContext.Provider value={{dark,colors:dark?darkColors:COLORS,setDark}}>{ready?children:null}</ThemeContext.Provider>;
}
export function useAppTheme(){return useContext(ThemeContext);}
