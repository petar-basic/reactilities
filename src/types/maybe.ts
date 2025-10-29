/**
 * Utility type that makes a type nullable and undefined
 * Represents a value that may or may not exist
 * Useful for optional values, API responses, and database queries
 * 
 * @template T - The base type to make optional
 * 
 * @example
 * // Basic usage
 * type User = {
 *   id: string;
 *   name: string;
 *   email: string;
 * };
 * 
 * function findUser(id: string): Maybe<User> {
 *   const user = database.users.find(u => u.id === id);
 *   return user; // Can be User, null, or undefined
 * }
 * 
 * const user = findUser('123');
 * if (user) {
 *   console.log(user.name); // TypeScript knows user is not null/undefined
 * }
 * 
 * @example
 * // API response handling
 * interface ApiResponse<T> {
 *   data: Maybe<T>;
 *   error: Maybe<string>;
 * }
 * 
 * async function fetchUser(id: string): Promise<ApiResponse<User>> {
 *   try {
 *     const response = await fetch(`/api/users/${id}`);
 *     const data = await response.json();
 *     return { data, error: null };
 *   } catch (error) {
 *     return { data: null, error: error.message };
 *   }
 * }
 * 
 * @example
 * // Optional configuration
 * interface AppConfig {
 *   apiKey: string;
 *   timeout: number;
 *   debugMode: Maybe<boolean>; // Can be true, false, null, or undefined
 *   customEndpoint: Maybe<string>;
 * }
 * 
 * const config: AppConfig = {
 *   apiKey: 'abc123',
 *   timeout: 5000,
 *   debugMode: undefined,
 *   customEndpoint: null
 * };
 * 
 * @example
 * // Function parameters
 * function updateProfile(
 *   userId: string,
 *   name: Maybe<string>,
 *   avatar: Maybe<string>
 * ) {
 *   const updates: any = {};
 *   if (name !== null && name !== undefined) updates.name = name;
 *   if (avatar !== null && avatar !== undefined) updates.avatar = avatar;
 *   
 *   return database.users.update(userId, updates);
 * }
 * 
 * updateProfile('123', 'John', null); // Valid
 * updateProfile('123', undefined, 'avatar.jpg'); // Valid
 */
export type Maybe<T> = T | null | undefined;
