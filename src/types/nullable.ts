/**
 * Utility type that makes a type nullable by adding null to the union
 * Useful for representing values that can be null in a type-safe way
 * 
 * @template T - The base type to make nullable
 * 
 * @example
 * // Basic usage
 * type User = {
 *   id: string;
 *   name: string;
 *   email: string;
 * };
 * 
 * type NullableUser = Nullable<User>; // User | null
 * 
 * function getUser(id: string): Nullable<User> {
 *   const user = users.find(u => u.id === id);
 *   return user || null;
 * }
 * 
 * @example
 * // With primitive types
 * type NullableString = Nullable<string>; // string | null
 * type NullableNumber = Nullable<number>; // number | null
 * 
 * function parseNumber(value: string): Nullable<number> {
 *   const parsed = parseInt(value, 10);
 *   return isNaN(parsed) ? null : parsed;
 * }
 * 
 * @example
 * // In function parameters
 * function updateUser(user: Nullable<User>) {
 *   if (user === null) {
 *     console.log('No user to update');
 *     return;
 *   }
 *   
 *   // TypeScript knows user is not null here
 *   console.log(`Updating user: ${user.name}`);
 * }
 */
export type Nullable<T> = T | null;
