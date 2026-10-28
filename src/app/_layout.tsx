import type { Session } from "@supabase/supabase-js";
import { Stack, useRouter, useSegments } from "expo-router";
import { useCallback, useEffect, useState } from "react";

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

  // Keep the animated launch screen visible until both the animation and
  // the initial Supabase session check have completed.
  if (!splashComplete || loading) {
    return (
      <SmartQueueSplash onAnimationComplete={handleSplashComplete} />
    );
  }

  return <Stack />;
}
