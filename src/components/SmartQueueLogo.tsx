import Svg, { Circle, Path, Rect } from "react-native-svg";

type SmartQueueLogoProps = {
  size?: number;
};

export default function SmartQueueLogo({ size = 120 }: SmartQueueLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Circle cx="60" cy="60" r="56" fill="#EAF5FF" />
      <Circle cx="60" cy="60" r="47" fill="#F4FBFA" />
      <Rect x="28" y="32" width="51" height="12" rx="6" fill="#4D91E8" />
      <Rect x="28" y="51" width="43" height="12" rx="6" fill="#47B8B0" />
      <Rect x="28" y="70" width="31" height="12" rx="6" fill="#A5DCD5" />
      <Circle cx="81" cy="76" r="25" fill="#FFFFFF" />
      <Circle cx="81" cy="76" r="22" fill="#25A99A" />
      <Path
        d="M69.5 76.5L77.2 84L92.8 67.5"
        stroke="#FFFFFF"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
