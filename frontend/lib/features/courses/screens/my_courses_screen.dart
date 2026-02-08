import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/utils/extensions.dart';
import '../../../shared/widgets/course_card.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../../shared/widgets/empty_state_widget.dart';
import '../providers/courses_provider.dart';

class MyCoursesScreen extends ConsumerWidget {
  const MyCoursesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final coursesAsync = ref.watch(myCoursesProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'My Courses',
          style: context.textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(myCoursesProvider),
        child: coursesAsync.when(
          loading: () => const LoadingWidget(message: 'Loading courses...'),
          error: (e, _) => AppErrorWidget(
            message: e.toString(),
            onRetry: () => ref.invalidate(myCoursesProvider),
          ),
          data: (assessments) {
            if (assessments.isEmpty) {
              return const EmptyStateWidget(
                message: 'No courses saved yet.\nSearch for topics on the dashboard!',
                icon: Icons.school_outlined,
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: assessments.length,
              itemBuilder: (context, index) {
                final assessment = assessments[index] as Map<String, dynamic>;
                final course =
                    assessment['course'] as Map<String, dynamic>? ?? {};
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: CourseCard(
                    title: course['title'] ?? '',
                    channelName: course['channel']?['title'] ?? '',
                    thumbnailUrl: course['thumbnail'] ?? '',
                    topicName: course['topic']?['name'],
                    videoCount: course['_count']?['videos'],
                    onTap: () => context.push('/course/${course['id']}'),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
