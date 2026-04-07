/**
 * Maps an explicitly missing, undefined, or null camera state to a string enum
 * required by the HTML select UI binding without collapsing un-chosen states to false.
 */
export function mapCameraStateToFormValue(isCameraDescribable?: boolean | null): 'null' | 'true' | 'false' {
  return isCameraDescribable === undefined || isCameraDescribable === null ? 'null' : (isCameraDescribable ? 'true' : 'false');
}
