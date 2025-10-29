/**
 * Utility type that makes all properties of a type optional recursively
 * Unlike built-in Partial<T>, this works on nested objects too
 * Useful for partial updates of deeply nested structures
 * 
 * @template T - The type to make deeply partial
 * 
 * @example
 * // Basic nested object
 * type User = {
 *   id: string;
 *   profile: {
 *     name: string;
 *     email: string;
 *     preferences: {
 *       theme: 'light' | 'dark';
 *       notifications: boolean;
 *     };
 *   };
 * };
 * 
 * type PartialUser = DeepPartial<User>;
 * // Result: {
 * //   id?: string;
 * //   profile?: {
 * //     name?: string;
 * //     email?: string;
 * //     preferences?: {
 * //       theme?: 'light' | 'dark';
 * //       notifications?: boolean;
 * //     };
 * //   };
 * // }
 * 
 * function updateUser(userId: string, updates: DeepPartial<User>) {
 *   // Can update any nested property without requiring all fields
 *   return { ...getUser(userId), ...updates };
 * }
 * 
 * // Valid partial updates
 * updateUser('123', { profile: { name: 'John' } });
 * updateUser('123', { profile: { preferences: { theme: 'dark' } } });
 * updateUser('123', { id: '456', profile: { email: 'new@email.com' } });
 * 
 * @example
 * // Configuration object
 * type AppConfig = {
 *   api: {
 *     baseUrl: string;
 *     timeout: number;
 *     retries: {
 *       count: number;
 *       delay: number;
 *     };
 *   };
 *   ui: {
 *     theme: string;
 *     language: string;
 *   };
 * };
 * 
 * function updateConfig(config: DeepPartial<AppConfig>) {
 *   // Can update any part of the config
 *   return mergeConfig(defaultConfig, config);
 * }
 * 
 * updateConfig({
 *   api: { timeout: 10000 }, // Only update timeout
 *   ui: { theme: 'dark' }     // Only update theme
 * });
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
