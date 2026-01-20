// API Client for SurgiTrack

const API_BASE = '/api';

interface LoginCredentials {
    username: string;
    password: string;
}

interface ApiResponse<T> {
    data?: T;
    error?: string;
}

// Store token in localStorage
export const setToken = (token: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', token);
    }
};

export const getToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('access_token');
    }
    return null;
};

export const removeToken = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
    }
};

// API helper function
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const token = getToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return { data };
    } catch (error) {
        return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

// Auth API
export const authApi = {
    login: async (credentials: LoginCredentials) => {
        const formData = new URLSearchParams();
        formData.append('username', credentials.username);
        formData.append('password', credentials.password);

        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Login failed');
        }

        return response.json();
    },

    logout: async () => {
        const result = await apiRequest('/auth/logout', { method: 'POST' });
        removeToken();
        return result;
    },

    getMe: () => apiRequest<{ id: number; username: string; full_name: string; role: string }>('/auth/me'),

    getSessions: () => apiRequest<Array<{
        id: number;
        username: string;
        action: string;
        ip_address: string;
        success: boolean;
        created_at: string;
    }>>('/auth/sessions'),
};

// Patients API
export const patientsApi = {
    getAll: () => apiRequest<Array<any>>('/patients'),
    getToday: () => apiRequest<Array<any>>('/patients/today'),
    getPublic: () => apiRequest<Array<any>>('/patients/public'),
    getStats: () => apiRequest<{
        total_today: number;
        waiting: number;
        in_surgery: number;
        recovering: number;
        postponed: number;
        returning: number;
        elective_count: number;
        emergency_count: number;
    }>('/patients/stats'),
    create: (data: any) => apiRequest('/patients', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: number, status: string, notes?: string) =>
        apiRequest(`/patients/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, notes })
        }),
    delete: (id: number) => apiRequest(`/patients/${id}`, { method: 'DELETE' }),
};
