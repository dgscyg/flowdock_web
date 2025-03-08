export const UserCode = "00101" // 普通用户
export const BusinessAdminCode = "00200" // 普通管理员
export const BusinessSuperAdmin = "00299" // 超级管理员
export const UserRoleMap = {
  [BusinessSuperAdmin]: "超级管理员",
  [BusinessAdminCode]: "普通管理员",
  [UserCode]: "普通用户"
};

export function getRoleText(userCode?: string): string {
  if (!userCode) return "未知身份";
  return UserRoleMap[userCode as keyof typeof UserRoleMap] || "未知身份";
}
