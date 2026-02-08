import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';

/// Provider for the user's assessed/saved courses.
final myCoursesProvider =
    FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final api = ref.watch(apiClientProvider);
  return api.get<List<dynamic>>(ApiConstants.myCourses);
});

/// Provider for a single course detail by ID.
final courseDetailProvider =
    FutureProvider.autoDispose.family<Map<String, dynamic>, String>(
  (ref, courseId) async {
    final api = ref.watch(apiClientProvider);
    return api.get<Map<String, dynamic>>(ApiConstants.courseDetail(courseId));
  },
);
