import type { IconType } from "react-icons";
import { FaEnvelope, FaGlobe } from "react-icons/fa6";
import {
  SiBilibili,
  SiDiscord,
  SiFacebook,
  SiGithub,
  SiInstagram,
  SiTiktok,
  SiWechat,
  SiX,
  SiYoutube,
} from "react-icons/si";
import type { SocialPlatform } from "./profile";

export function getSocialPlatformIcon(platform: SocialPlatform): IconType {
  switch (platform) {
    case "bilibili":
      return SiBilibili;
    case "discord":
      return SiDiscord;
    case "email":
      return FaEnvelope;
    case "facebook":
      return SiFacebook;
    case "github":
      return SiGithub;
    case "instagram":
      return SiInstagram;
    case "tiktok":
      return SiTiktok;
    case "wechat":
      return SiWechat;
    case "website":
      return FaGlobe;
    case "x":
      return SiX;
    case "youtube":
      return SiYoutube;
  }
}
