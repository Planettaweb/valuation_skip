import { supabase } from '@/lib/supabase/client'

export const userSettingsService = {
  async updateProfile(userId: string, data: { full_name?: string }) {
    const { error } = await supabase.from('users').update(data).eq('id', userId)
    return { error }
  },

  async get2FAStatus(userId: string) {
    const { data, error } = await supabase
      .from('two_factor_auth')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    return { data, error }
  },

  async enable2FA(userId: string, orgId: string) {
    const secret =
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const { data: existing } = await this.get2FAStatus(userId)

    if (existing) {
      const { error } = await supabase
        .from('two_factor_auth')
        .update({ is_enabled: true, secret })
        .eq('user_id', userId)
      return { error, secret }
    } else {
      const { error } = await supabase
        .from('two_factor_auth')
        .insert({ user_id: userId, org_id: orgId, secret, is_enabled: true })
      return { error, secret }
    }
  },

  async disable2FA(userId: string) {
    const { error } = await supabase
      .from('two_factor_auth')
      .update({ is_enabled: false })
      .eq('user_id', userId)
    return { error }
  },

  async getSessionOverview(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('last_login')
      .eq('id', userId)
      .single()
    return { data, error }
  },
}
