import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { type AxiosResponse } from 'axios';

export interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: { high: { url: string } };
  };
}

export interface YouTubeVideoItem {
  id: string;
  contentDetails: { duration: string };
  statistics: { viewCount: string };
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
}

interface YouTubeVideoResponse {
  items?: YouTubeVideoItem[];
}

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('YOUTUBE_API_KEY', '');
  }

  /**
   * Search YouTube for videos matching a query.
   * Cost: 100 quota units per call.
   */
  async searchVideos(
    query: string,
    maxResults = 10,
  ): Promise<YouTubeSearchItem[]> {
    try {
      const response: AxiosResponse<YouTubeSearchResponse> = await axios.get(
        `${this.baseUrl}/search`,
        {
          params: {
            part: 'snippet',
            q: `${query} full course tutorial`,
            type: 'video',
            videoDuration: 'long',
            maxResults,
            key: this.apiKey,
          },
        },
      );
      return response.data.items ?? [];
    } catch (error) {
      this.logger.error('YouTube search failed', error);
      return [];
    }
  }

  /**
   * Get video details (duration, view count) for a batch of IDs.
   * Cost: 1 quota unit per call.
   */
  async getVideoDetails(videoIds: string[]): Promise<YouTubeVideoItem[]> {
    if (videoIds.length === 0) return [];

    try {
      const response: AxiosResponse<YouTubeVideoResponse> = await axios.get(
        `${this.baseUrl}/videos`,
        {
          params: {
            part: 'contentDetails,statistics',
            id: videoIds.join(','),
            key: this.apiKey,
          },
        },
      );
      return response.data.items ?? [];
    } catch (error) {
      this.logger.error('YouTube video details failed', error);
      return [];
    }
  }

  /** Convert ISO 8601 duration (PT1H2M30S) to seconds. */
  parseDuration(iso: string): number {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] ?? '0', 10);
    const minutes = parseInt(match[2] ?? '0', 10);
    const seconds = parseInt(match[3] ?? '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
  }
}
