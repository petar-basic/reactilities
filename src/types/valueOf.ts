/**
 * Utility type that extracts all possible values from an object type
 * Useful for creating union types from object values
 * 
 * @template T - The object type to extract values from
 * 
 * @example
 * // Basic usage with object
 * const Colors = {
 *   RED: '#ff0000',
 *   GREEN: '#00ff00',
 *   BLUE: '#0000ff'
 * } as const;
 * 
 * type ColorValue = ValueOf<typeof Colors>; // '#ff0000' | '#00ff00' | '#0000ff'
 * 
 * function setColor(color: ColorValue) {
 *   // color can only be one of the defined color values
 *   console.log(`Setting color to: ${color}`);
 * }
 * 
 * setColor(Colors.RED); // ✅ Valid
 * setColor('#ffffff'); // ❌ TypeScript error
 * 
 * @example
 * // With status object
 * const Status = {
 *   PENDING: 'pending',
 *   SUCCESS: 'success',
 *   ERROR: 'error'
 * } as const;
 * 
 * type StatusValue = ValueOf<typeof Status>; // 'pending' | 'success' | 'error'
 * 
 * function handleStatus(status: StatusValue) {
 *   switch (status) {
 *     case 'pending':
 *       return 'Loading...';
 *     case 'success':
 *       return 'Done!';
 *     case 'error':
 *       return 'Failed!';
 *   }
 * }
 * 
 * @example
 * // With mixed value types
 * const Config = {
 *   timeout: 5000,
 *   retries: 3,
 *   enabled: true,
 *   mode: 'production'
 * } as const;
 * 
 * type ConfigValue = ValueOf<typeof Config>; // 5000 | 3 | true | 'production'
 */
export type ValueOf<T> = T[keyof T];
