import { supabase } from '@/lib/supabase/client'

export const adminService = {
  // Users
  async getUsers() {
    return await supabase
      .from('users')
      .select(
        `id, email, full_name, is_active, org_id, avatar_url, organizations(name), users_roles(role_id, roles(name))`,
      )
      .order('created_at', { ascending: false })
  },
  async createUser(data: any, roleId: string) {
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: data.email,
        full_name: data.full_name,
        org_id: data.org_id,
        is_active: true,
      })
      .select()
      .single()

    if (user && roleId && !error) {
      await supabase.from('users_roles').insert({ user_id: user.id, role_id: roleId })
    }
    return { data: user, error }
  },
  async updateUser(id: string, data: any, roleId: string) {
    const { error } = await supabase
      .from('users')
      .update({
        email: data.email,
        full_name: data.full_name,
        org_id: data.org_id,
      })
      .eq('id', id)

    if (!error && roleId) {
      await supabase.from('users_roles').delete().eq('user_id', id)
      await supabase.from('users_roles').insert({ user_id: id, role_id: roleId })
    }
    return { error }
  },
  async deleteUser(id: string) {
    return await supabase.from('users').delete().eq('id', id)
  },
  async toggleUserActive(id: string, is_active: boolean) {
    return await supabase.from('users').update({ is_active }).eq('id', id)
  },

  // Organizations
  async getOrgs() {
    return await supabase.from('organizations').select('*').order('name')
  },
  async createOrg(data: any) {
    return await supabase.from('organizations').insert(data).select().single()
  },
  async updateOrg(id: string, data: any) {
    return await supabase.from('organizations').update(data).eq('id', id).select().single()
  },
  async deleteOrg(id: string) {
    return await supabase.from('organizations').delete().eq('id', id)
  },

  // Roles
  async getRoles() {
    return await supabase.from('roles').select('*').order('name')
  },
  async createRole(data: any) {
    return await supabase.from('roles').insert(data).select().single()
  },
  async updateRole(id: string, data: any) {
    return await supabase.from('roles').update(data).eq('id', id).select().single()
  },
  async deleteRole(id: string) {
    return await supabase.from('roles').delete().eq('id', id)
  },

  // Permissions
  async getPermissions() {
    return await supabase.from('permissions').select('*').order('resource').order('action')
  },
  async getRolePermissions(roleId: string) {
    return await supabase.from('role_permissions').select('*').eq('role_id', roleId)
  },
  async setRolePermission(roleId: string, permissionId: string, allowed: boolean) {
    const { data } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role_id', roleId)
      .eq('permission_id', permissionId)
      .single()

    if (data) {
      return await supabase
        .from('role_permissions')
        .update({ allowed })
        .eq('role_id', roleId)
        .eq('permission_id', permissionId)
    } else {
      return await supabase
        .from('role_permissions')
        .insert({ role_id: roleId, permission_id: permissionId, allowed })
    }
  },
}
