import { supabase } from '@/lib/supabase/client'

export const userService = {
  async getUsers(orgId: string) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id, email, full_name, is_active,
        users_roles ( role_id, roles(name) )
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async getRoles() {
    const { data, error } = await supabase.from('roles').select('*')
    return { data, error }
  },

  async toggleActive(userId: string, isActive: boolean) {
    const { error } = await supabase.from('users').update({ is_active: isActive }).eq('id', userId)
    return { error }
  },

  async updateRole(userId: string, roleId: string) {
    await supabase.from('users_roles').delete().eq('user_id', userId)
    const { error } = await supabase
      .from('users_roles')
      .insert({ user_id: userId, role_id: roleId })
    return { error }
  },
}
