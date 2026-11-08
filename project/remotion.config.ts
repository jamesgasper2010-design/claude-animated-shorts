import { Config } from "@remotion/cli/config";

// JPEG frames render faster and the final video is encoded with h264 anyway.
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
