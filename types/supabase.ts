export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            leads: {
                Row: {
                    id: string
                    messenger_id: string
                    state: string
                    full_name: string | null
                    mobile: string | null
                    approved_amount: string | null
                    job_status: string | null
                    rejection_reason: string | null
                    retry_count: number | null
                    alternate_attempt: number | null
                    original_name: string | null
                    original_mobile: string | null
                    screenshot_urls: string[] | null
                    otp1_attempts: number | null
                    otp2_attempts: number | null
                    session_id: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: any
                Update: any
            }
            bot_settings: {
                Row: {
                    id: string
                    key: string
                    value: string
                    label: string | null
                    description: string | null
                    is_sensitive: boolean | null
                    updated_at: string | null
                }
                Insert: any
                Update: any
            }
            bot_prompts: {
                Row: {
                    id: string
                    state_name: string
                    response_text: string
                    description: string | null
                    scenario_name: string | null
                    updated_at: string | null
                }
                Insert: any
                Update: any
            }
            scenarios: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    is_active: boolean | null
                    created_at: string | null
                }
                Insert: any
                Update: any
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
