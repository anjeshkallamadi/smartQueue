import type { Session } from "@supabase/supabase-js";
import { Stack, useRouter, useSegments } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import SmartQueueSplash from "../components/SmartQueueSplash";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [splashComplete, setSplashComplete] = useState(false);

  const router = useRouter();
  const segments = useSegments();

  const handleSplashComplete = useCallback(() => {
    setSplashComplete(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const currentRoute = segments[0];
    const isPublicRoute =
      currentRoute === undefined ||
      currentRoute === "login" ||
      currentRoute === "register";

    if (!session && !isPublicRoute) {
      router.replace("/login");
    } else if (session && isPublicRoute) {
      router.replace("/home");
    }
  }, [session, loading, segments, router]);

  return (
    <View style={{ flex: 1 }}>
      <Stack />
      {(!splashComplete || loading) && (
        <View
          pointerEvents="auto"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 10,
          }}
        >
          <SmartQueueSplash onAnimationComplete={handleSplashComplete} />
        </View>
      )}
    </View>
  );
}
