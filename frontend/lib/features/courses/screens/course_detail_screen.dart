import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/utils/extensions.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/error_widget.dart';
import '../providers/courses_provider.dart';

/// Course detail: one [CustomScrollView] for header + video list (single scroll).
class CourseDetailScreen extends ConsumerWidget {
  const CourseDetailScreen({super.key, required this.courseId});

  final String courseId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final courseAsync = ref.watch(courseDetailProvider(courseId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Course Details'),
      ),
      body: courseAsync.when(
        loading: () => const LoadingWidget(message: 'Loading course...'),
        error: (e, _) => AppErrorWidget(
          message: e.toString(),
          onRetry: () => ref.invalidate(courseDetailProvider(courseId)),
        ),
        data: (course) {
          final videos = (course['videos'] as List?) ?? [];
          return CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        course['title'] ?? '',
                        style: context.textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        course['channel']?['title'] ?? '',
                        style: context.textTheme.titleMedium?.copyWith(
                          color: context.colorScheme.primary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      if (course['description'] != null &&
                          (course['description'] as String).isNotEmpty)
                        Text(
                          course['description'],
                          style: context.textTheme.bodyMedium,
                        ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Chip(
                            avatar: const Icon(Icons.topic, size: 16),
                            label:
                                Text(course['topic']?['name'] ?? 'Unknown'),
                          ),
                          const SizedBox(width: 8),
                          Chip(
                            avatar: const Icon(Icons.video_library, size: 16),
                            label: Text('${videos.length} videos'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    'Videos',
                    style: context.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 8)),
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final video = videos[index] as Map<String, dynamic>;
                    final duration =
                        (video['durationSeconds'] as int?) ?? 0;
                    return ListTile(
                      leading: CircleAvatar(
                        child: Text('${index + 1}'),
                      ),
                      title: Text(
                        video['title'] ?? '',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      subtitle: Text(duration.toReadableDuration()),
                      trailing: IconButton(
                        icon: const Icon(Icons.play_circle_fill),
                        color: context.colorScheme.primary,
                        onPressed: () {
                          final videoId = video['youtubeVideoId'];
                          final url = Uri.parse(
                              'https://www.youtube.com/watch?v=$videoId');
                          launchUrl(url,
                              mode: LaunchMode.externalApplication);
                        },
                      ),
                    );
                  },
                  childCount: videos.length,
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 32)),
            ],
          );
        },
      ),
    );
  }
}
