/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export function getPath(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return normalizedPath;
}
