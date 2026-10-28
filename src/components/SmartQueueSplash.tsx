import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import SmartQueueLogo from "./SmartQueueLogo";

type SmartQueueSplashProps = {
  onAnimationComplete: () => void;
};

export default function SmartQueueSplash({
  onAnimationComplete,
}: SmartQueueSplashProps) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.72)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(12)).current;
  const rippleScale = useRef(new Animated.Value(0.72)).current;
  const rippleOpacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const entrance = Animated.parallel([
      Animated.sequence([
        Animated.delay(180),
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 520,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.spring(logoScale, {
            toValue: 1,
            speed: 12,
            bounciness: 5,
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(650),
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(titleTranslateY, {
            toValue: 0,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(260),
        Animated.parallel([
          Animated.timing(rippleScale, {
            toValue: 1.22,
            duration: 850,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(rippleOpacity, {
            toValue: 0,
            duration: 850,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]);

    entrance.start();
    const completionTimer = setTimeout(onAnimationComplete, 1800);

    return () => {
      entrance.stop();
      clearTimeout(completionTimer);
    };
  }, [
    logoOpacity,
    logoScale,
    titleOpacity,
    titleTranslateY,
    rippleScale,
    rippleOpacity,
    onAnimationComplete,
  ]);

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.topGlow} />
      <View pointerEvents="none" style={styles.bottomGlow} />

      <View style={styles.brandGroup}>
        <View style={styles.logoStage}>
          <Animated.View
            style={[
              styles.ripple,
              {
                opacity: rippleOpacity,
                transform: [{ scale: rippleScale }],
              },
            ]}
          />
          <Animated.View
            style={{
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            }}
          >
            <SmartQueueLogo size={132} />
          </Animated.View>
        </View>

        <Animated.View
          style={{
            alignItems: "center",
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          }}
        >
          <Text style={styles.title}>
            Smart<Text style={styles.titleAccent}>Queue</Text>
          </Text>
          <Text style={styles.tagline}>Your time. Your turn. Smarter.</Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </Animated.View>
      </View>

      <Text style={styles.footer}>A smoother way to wait</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  topGlow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -145,
    right: -110,
    backgroundColor: "#E9F5FF",
  },
  bottomGlow: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    bottom: -190,
    left: -130,
    backgroundColor: "#EAF9F5",
  },
  brandGroup: {
    alignItems: "center",
    marginTop: -16,
  },
  logoStage: {
    width: 180,
    height: 170,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  ripple: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1.5,
    borderColor: "#A7DCD6",
    backgroundColor: "#F4FBFA",
  },
  title: {
    color: "#20334D",
    fontSize: 36,
    letterSpacing: -1.2,
    fontWeight: "800",
  },
  titleAccent: {
    color: "#299F9A",
  },
  tagline: {
    marginTop: 9,
    color: "#718096",
    fontSize: 14,
    letterSpacing: 0.25,
  },
  progressTrack: {
    marginTop: 30,
    width: 76,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E6F0F7",
    overflow: "hidden",
  },
  progressFill: {
    width: "68%",
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#54B9B0",
  },
  footer: {
    position: "absolute",
    bottom: 42,
    color: "#9AA9B9",
    fontSize: 12,
    letterSpacing: 0.4,
  },
});
