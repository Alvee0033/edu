class ApiConstants {
  ApiConstants._();

  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000/api/v1',
  );

  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String refresh = '/auth/refresh';

  // Users
  static const String me = '/users/me';
  static const String myCourses = '/users/me/courses';

  // Topics
  static const String topics = '/topics';

  // Courses
  static const String courses = '/courses';
  static const String searchCourses = '/courses/search';
  static String courseDetail(String id) => '/courses/$id';
  static String assessCourse(String id) => '/courses/$id/assess';
  static String updateProgress(String id) => '/courses/$id/progress';

  // Analytics
  static const String dashboard = '/analytics/dashboard';
  static const String platformStats = '/analytics/platform';
}
