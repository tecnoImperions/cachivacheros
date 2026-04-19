import LoginScreen from '../src/screens/auth/LoginScreen';
import { useRouter } from 'expo-router';

export default function Login() {
    const router = useRouter();
    return (
        <LoginScreen
            navigation={{
                navigate: (screen: string) => router.push(`/${screen.toLowerCase()}` as any),
                goBack:   () => router.back(),
            }}
        />
    );
}