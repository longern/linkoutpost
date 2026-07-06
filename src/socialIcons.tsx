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
