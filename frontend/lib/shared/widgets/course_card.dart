import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../core/utils/extensions.dart';

/// Reusable course card for list displays.
class CourseCard extends StatelessWidget {
  const CourseCard({
    super.key,
    required this.title,
    required this.channelName,
    required this.thumbnailUrl,
    this.topicName,
    this.videoCount,
    this.durationSeconds,
    this.onTap,
  });

  final String title;
  final String channelName;
  final String thumbnailUrl;
  final String? topicName;
  final int? videoCount;
  final int? durationSeconds;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Thumbnail
            AspectRatio(
              aspectRatio: 16 / 9,
              child: CachedNetworkImage(
                imageUrl: thumbnailUrl,
                fit: BoxFit.cover,
                placeholder: (_, __) => Container(
                  color: context.colorScheme.surfaceContainerHighest,
                  child: const Center(child: CircularProgressIndicator()),
                ),
                errorWidget: (_, __, ___) => Container(
                  color: context.colorScheme.surfaceContainerHighest,
                  child: const Icon(Icons.broken_image, size: 48),
                ),
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  Text(
                    title,
                    style: context.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),

                  // Channel
                  Text(
                    channelName,
                    style: context.textTheme.bodySmall?.copyWith(
                      color: context.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Meta row
                  Row(
                    children: [
                      if (topicName != null) ...[
                        _Chip(label: topicName!, context: context),
                        const SizedBox(width: 8),
                      ],
                      if (videoCount != null)
                        Text(
                          '$videoCount videos',
                          style: context.textTheme.labelSmall,
                        ),
                      const Spacer(),
                      if (durationSeconds != null)
                        Text(
                          durationSeconds!.toReadableDuration(),
                          style: context.textTheme.labelSmall,
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.context});
  final String label;
  final BuildContext context;

  @override
  Widget build(BuildContext _) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: context.colorScheme.primaryContainer,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: context.textTheme.labelSmall?.copyWith(
          color: context.colorScheme.onPrimaryContainer,
        ),
      ),
    );
  }
}
