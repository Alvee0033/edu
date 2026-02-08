import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';

final searchQueryProvider = StateProvider<String>((ref) => '');

final searchResultsProvider =
    FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final query = ref.watch(searchQueryProvider);
  if (query.isEmpty) return [];

  final api = ref.watch(apiClientProvider);
  return api.post<List<dynamic>>(
    ApiConstants.searchCourses,
    body: {'query': query, 'maxResults': 10},
  );
});
