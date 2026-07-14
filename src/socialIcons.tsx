import type { IconType } from "react-icons";
import { FaEnvelope, FaGlobe, FaLinkedin } from "react-icons/fa6";
import {
  SiBilibili,
  SiBluesky,
  SiDiscord,
  SiFacebook,
  SiGithub,
  SiInstagram,
  SiMastodon,
  SiMedium,
  SiPinterest,
  SiQq,
  SiReddit,
  SiSnapchat,
  SiSpotify,
  SiSubstack,
  SiTelegram,
  SiThreads,
  SiTiktok,
  SiTwitch,
  SiSinaweibo,
  SiWechat,
  SiWhatsapp,
  SiX,
  SiXiaohongshu,
  SiYoutube,
} from "react-icons/si";
import type { SocialPlatform } from "./profile";

const socialPlatformColors = {
  bilibili: "#00aeec",
  bluesky: "#0285ff",
  discord: "#5865f2",
  email: "#ea4335",
  facebook: "#1877f2",
  github: "#181717",
  instagram: "#e4405f",
  linkedin: "#0a66c2",
  mastodon: "#6364ff",
  medium: "#000000",
  pinterest: "#bd081c",
  qq: "#12b7f5",
  reddit: "#ff4500",
  snapchat: "#fffc00",
  spotify: "#1db954",
  substack: "#ff6719",
  telegram: "#26a5e4",
  threads: "#000000",
  tiktok: "#000000",
  twitch: "#9146ff",
  wechat: "#07c160",
  weibo: "#e6162d",
  whatsapp: "#25d366",
  website: "#2563eb",
  x: "#000000",
  xiaohongshu: "#ff2442",
  youtube: "#ff0000",
} satisfies Record<SocialPlatform, string>;

export function getSocialPlatformColor(platform: SocialPlatform): string {
  return socialPlatformColors[platform];
}

export function getSocialPlatformIcon(platform: SocialPlatform): IconType {
  switch (platform) {
    case "bilibili":
      return SiBilibili;
    case "bluesky":
      return SiBluesky;
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
    case "linkedin":
      return FaLinkedin;
    case "mastodon":
      return SiMastodon;
    case "medium":
      return SiMedium;
    case "pinterest":
      return SiPinterest;
    case "qq":
      return SiQq;
    case "reddit":
      return SiReddit;
    case "snapchat":
      return SiSnapchat;
    case "spotify":
      return SiSpotify;
    case "substack":
      return SiSubstack;
    case "telegram":
      return SiTelegram;
    case "threads":
      return SiThreads;
    case "tiktok":
      return SiTiktok;
    case "twitch":
      return SiTwitch;
    case "wechat":
      return SiWechat;
    case "weibo":
      return SiSinaweibo;
    case "whatsapp":
      return SiWhatsapp;
    case "website":
      return FaGlobe;
    case "x":
      return SiX;
    case "xiaohongshu":
      return SiXiaohongshu;
    case "youtube":
      return SiYoutube;
  }
}
