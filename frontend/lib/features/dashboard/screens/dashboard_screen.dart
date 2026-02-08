import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/utils/extensions.dart';
import '../../../shared/widgets/stat_card.dart';
import '../../../shared/widgets/course_card.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/error_widget.dart';
import '../providers/dashboard_provider.dart';
import '../providers/search_provider.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearch() {
    final query = _searchController.text.trim();
    if (query.isNotEmpty) {
      ref.read(searchQueryProvider.notifier).state = query;
    }
  }

  @override
  Widget build(BuildContext context) {
    final dashboardAsync = ref.watch(dashboardProvider);
    final searchAsync = ref.watch(searchResultsProvider);
    final currentQuery = ref.watch(searchQueryProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Dashboard',
          style: context.textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(dashboardProvider);
          ref.invalidate(platformStatsProvider);
        },
        child: CustomScrollView(
          slivers: [
            // ─── Search Bar ─────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search free courses (e.g. Machine Learning)...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.arrow_forward),
                      onPressed: _onSearch,
                    ),
                  ),
                  onSubmitted: (_) => _onSearch(),
                ),
              ),
            ),

            // ─── Analytics Cards ────────────────────────────────────────
            dashboardAsync.when(
              loading: () => const SliverToBoxAdapter(
                child: SizedBox(height: 120, child: LoadingWidget()),
              ),
              error: (e, _) => SliverToBoxAdapter(
                child: AppErrorWidget(
                  message: e.toString(),
                  onRetry: () => ref.invalidate(dashboardProvider),
                ),
              ),
              data: (stats) => SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      Expanded(
                        child: StatCard(
                          label: 'Saved',
                          value: '${stats['totalSaved'] ?? 0}',
                          icon: Icons.bookmark,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: StatCard(
                          label: 'Completed',
                          value: '${stats['totalCompleted'] ?? 0}',
                          icon: Icons.check_circle,
                          color: Colors.green,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // ─── Search Results ─────────────────────────────────────────
            if (currentQuery.isNotEmpty) ...[
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'Results for "$currentQuery"',
                    style: context.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
              searchAsync.when(
                loading: () => const SliverToBoxAdapter(
                  child: SizedBox(height: 200, child: LoadingWidget()),
                ),
                error: (e, _) => SliverToBoxAdapter(
                  child: AppErrorWidget(
                    message: e.toString(),
                    onRetry: () => ref.invalidate(searchResultsProvider),
                  ),
                ),
                data: (courses) => SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final course = courses[index] as Map<String, dynamic>;
                      return Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 4),
                        child: CourseCard(
                          title: course['title'] ?? '',
                          channelName: course['channel']?['title'] ?? '',
                          thumbnailUrl: course['thumbnail'] ?? '',
                          topicName: course['topic']?['name'],
                          videoCount: (course['videos'] as List?)?.length,
                          onTap: () => context.push('/course/${course['id']}'),
                        ),
                      );
                    },
                    childCount: courses.length,
                  ),
                ),
              ),
            ],

            // Bottom padding
            const SliverToBoxAdapter(child: SizedBox(height: 24)),
          ],
        ),
      ),
    );
  }
}
