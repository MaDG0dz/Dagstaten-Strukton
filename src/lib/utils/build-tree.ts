export interface TreeNode<T> {
  item: T;
  children: TreeNode<T>[];
}

export function buildTree<T extends { id: string; parent_id: string | null }>(
  items: T[]
): TreeNode<T>[] {
  const map = new Map<string, TreeNode<T>>();
  const roots: TreeNode<T>[] = [];

  for (const item of items) {
    map.set(item.id, { item, children: [] });
  }

  for (const item of items) {
    const node = map.get(item.id)!;
    if (item.parent_id && map.has(item.parent_id)) {
      map.get(item.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
