// import { useEffect, useState } from "react"
// import { login } from "../service/auth-service";

// const useAuth = (userName: string, password: string) => {
//     const [accessToken, setAccessToken] = useState<string>();
//     const [refreshToken, setRefreshToken] = useState<string>();
//     const [user, setUser] = useState<any>();

//     useEffect(() => {
//         const response = await login(userName, password);
//         if (response) {
//             setAccessToken(response.accessToken);
//             setRefreshToken(response.refreshToken);
//             setUser(response.user);
//         }
//     })
    
// }

// export default useAuth