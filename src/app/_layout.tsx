import { ThemeProvider, DarkTheme, DefaultTheme } from "expo-router/react-navigation";
import { AppThemeProvider, useAppTheme } from "../context/ThemeContext";
import { StatusBar } from "expo-status-bar";
import type { Session } from "@supabase/supabase-js";
import { Stack, useRouter, useSegments } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { supabase } from "../lib/supabase";
import NotificationPopup from "../components/NotificationPopup";
import SmartQueueSplash from "../components/SmartQueueSplash";

export default function RootLayout() { return <AppThemeProvider><RootContent /></AppThemeProvider>; }
function RootContent() {
  const {dark,colors}=useAppTheme();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [splashComplete, setSplashComplete] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const handleSplashComplete = useCallback(() => setSplashComplete(true), []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;
    const currentRoute = segments[0];
    const isPublicRoute = currentRoute === undefined || currentRoute === "login" || currentRoute === "register";
    if (!session && !isPublicRoute) router.replace("/login");
    else if (session && isPublicRoute) router.replace("/home");
  }, [session, loading, segments, router]);

  return (
    <ThemeProvider value={{...(dark?DarkTheme:DefaultTheme),colors:{...(dark?DarkTheme:DefaultTheme).colors,background:colors.background,card:colors.surface,text:colors.text,border:colors.border,primary:colors.primary}}}>
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={dark?"light":"dark"}/>
      <Stack />
      {session?.user.id ? <NotificationPopup key={session.user.id} userId={session.user.id} /> : null}
      {(!splashComplete || loading) && (
        <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 100 }}>
          <SmartQueueSplash onAnimationComplete={handleSplashComplete} />
          {loading ? <View pointerEvents="none" style={{ position: "absolute", bottom: 18, alignSelf: "center" }}><ActivityIndicator color="#3986D7" /></View> : null}
        </View>
      )}
    </View>
    </ThemeProvider>
  );
}