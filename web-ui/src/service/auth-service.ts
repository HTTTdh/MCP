import axios from "axios"
import { AUTH } from "../constant/api-endpoints"

interface AuthResponse {
    accessToken: string,
    refreshToken: string,
    user: {
        email: string,
        avartarPath: string,
    }
}
export const login = async (username: string, password: string): Promise<AuthResponse> => {
    const response = await axios.post(
        AUTH.LOGIN,
        { username, password }
    ) as {
        status: number,
        data: AuthResponse 
    };
    return response.data;
}