// shared/roles.ts
// 角色相关代码：角色定义、角色列表、图标路径工具
// 注意：localStorage 持久化属于浏览器行为，在前端 settingsStore 中处理，
// 本文件需保持服务端可用，不引用任何 window/document/localStorage。

export interface RoleDef {
  /** 角色唯一 id，同时对应前端 assets/roles/{id}.png 图标文件 */
  id: number;
  /** 角色显示名 */
  name: string;
  /** 角色描述（下一步角色玩法补充） */
  desc: string;
}

/**
 * 角色列表
 * 具体角色内容下一步再做，当前仅放僵尸占位。
 * 新增角色时追加即可，id 与 assets/roles/ 下的 png 文件名对应。
 */
export const ROLES: RoleDef[] = [
  { id: 1, name: '僵尸', desc: '' },
];

/** 默认角色：僵尸 */
export const DEFAULT_ROLE_ID: number = ROLES[0].id;

/** 角色图标路径（低像素 png，前端渲染时使用 image-rendering: pixelated 保持像素清晰） */
export function getRoleIconPath(id: number): string {
  return `/assets/roles/${id}.png`;
}

/** 按 id 取角色定义，找不到（如 localStorage 脏数据）时回退默认角色 */
export function getRoleById(id: number): RoleDef {
  return ROLES.find(r => r.id === id) ?? ROLES[0];
}
